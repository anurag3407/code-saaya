import { Octokit } from "@octokit/rest";
import type { GeneratedFile } from "@/types/saaya";

/**
 * Format Octokit errors into descriptive human-readable strings
 */
function formatOctokitError(err: unknown): string {
  if (err && typeof err === "object" && "status" in err) {
    const octokitErr = err as {
      status?: number;
      message?: string;
      response?: {
        data?: {
          message?: string;
          errors?: Array<{ message?: string; code?: string; field?: string }>;
        };
      };
    };
    const status = octokitErr.status || "Unknown";
    const apiMsg =
      octokitErr.response?.data?.message || octokitErr.message || "Unknown error";
    const details = octokitErr.response?.data?.errors
      ? octokitErr.response.data.errors
          .map((e) => e.message || e.code || JSON.stringify(e))
          .join(", ")
      : "";
    return `GitHub API Error (${status}): ${apiMsg}${details ? ` — ${details}` : ""}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Cross-repo PR automation:
 * 1. Check if the user has push access to the target repo
 * 2. If YES → create branch + commit + PR directly
 * 3. If NO  → fork the repo → create branch on fork → PR from fork to upstream
 *
 * All operations use base64 blob creation for 100% robust tree construction.
 */
export async function createSaayaPullRequest({
  githubToken,
  owner,
  repo,
  saayaFiles,
  onLog,
}: {
  githubToken: string;
  owner: string;
  repo: string;
  saayaFiles: GeneratedFile[];
  onLog?: (msg: string) => void;
}): Promise<string> {
  const token = githubToken.trim().replace(/^["']|["']$/g, "");
  if (!token) {
    throw new Error(
      "GitHub token is missing. Please connect your GitHub account in Settings."
    );
  }

  const octokit = new Octokit({ auth: token, userAgent: "code-saaya/v1.0.0" });

  let username = "";
  try {
    const { data: user } = await octokit.users.getAuthenticated();
    username = user.login;
    onLog?.(`Authenticated as @${username}`);
  } catch (err) {
    throw new Error(`Failed to authenticate with GitHub: ${formatOctokitError(err)}`);
  }

  // 1. Get target repo info
  let defaultBranch = "main";
  let hasPushAccess = false;
  try {
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    defaultBranch = repoData.default_branch;
    hasPushAccess =
      repoData.permissions?.push || repoData.permissions?.admin || false;
  } catch (err) {
    throw new Error(`Failed to get target repository info: ${formatOctokitError(err)}`);
  }

  let workOwner: string; // Where we create the branch
  let workRepo: string;
  let headPrefix = ""; // For cross-fork PRs: "username:branch"

  if (hasPushAccess) {
    // Direct PR to the target repo
    workOwner = owner;
    workRepo = repo;
    onLog?.(`Push access confirmed on ${owner}/${repo} — creating direct PR`);
  } else {
    // Fork workflow
    onLog?.(`No push access on ${owner}/${repo} — forking to @${username}...`);

    // Check if fork already exists
    let forkData;
    try {
      const { data: existingFork } = await octokit.repos.get({
        owner: username,
        repo,
      });
      if (existingFork.fork && existingFork.parent?.full_name === `${owner}/${repo}`) {
        forkData = existingFork;
        onLog?.(`Using existing fork: ${username}/${repo}`);
      }
    } catch {
      // Fork doesn't exist
    }

    if (!forkData) {
      try {
        const { data: newFork } = await octokit.repos.createFork({
          owner,
          repo,
        });
        forkData = newFork;
        onLog?.(`Fork created: ${username}/${repo}`);
        await waitForFork(octokit, username, repo);
      } catch (err) {
        throw new Error(`Failed to create repository fork: ${formatOctokitError(err)}`);
      }
    }

    workOwner = username;
    workRepo = repo;
    headPrefix = `${username}:`;
  }

  // 3. Get latest commit SHA & root tree SHA from upstream target repo
  let latestCommitSha = "";
  let baseTreeSha = "";
  try {
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });
    latestCommitSha = refData.object.sha;

    const { data: commitObj } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha,
    });
    baseTreeSha = commitObj.tree.sha;
  } catch (err) {
    throw new Error(
      `Failed to get base commit/tree for branch '${defaultBranch}' on ${owner}/${repo}: ${formatOctokitError(err)}`
    );
  }

  // 4. Deduplicate and clean file paths
  const uniqueFilesMap = new Map<string, string>();
  for (const file of saayaFiles) {
    if (!file || !file.path) continue;
    const cleanPath = `.saaya/repowiki/${file.path}`
      .replace(/\/+/g, "/")
      .replace(/^\//, "");
    const contentStr =
      typeof file.content === "string"
        ? file.content
        : JSON.stringify(file.content || "");
    uniqueFilesMap.set(cleanPath, contentStr);
  }

  // 5. Create Git Blobs with Base64 encoding (prevents GitHub API 500 parsing errors)
  onLog?.(`Creating Git blobs for ${uniqueFilesMap.size} generated files...`);
  let treeItems: Array<{
    path: string;
    mode: "100644";
    type: "blob";
    sha: string;
  }> = [];

  try {
    treeItems = await Promise.all(
      Array.from(uniqueFilesMap.entries()).map(async ([cleanPath, contentStr]) => {
        const base64Content = Buffer.from(contentStr, "utf-8").toString("base64");
        const { data: blobData } = await octokit.git.createBlob({
          owner: workOwner,
          repo: workRepo,
          content: base64Content,
          encoding: "base64",
        });

        return {
          path: cleanPath,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blobData.sha,
        };
      })
    );
  } catch (err) {
    throw new Error(`Failed to create Git blobs: ${formatOctokitError(err)}`);
  }

  // 6. Create Git Tree linking the blob SHAs with base_tree
  let treeSha = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data: treeData } = await octokit.git.createTree({
        owner: workOwner,
        repo: workRepo,
        base_tree: baseTreeSha,
        tree: treeItems,
      });
      treeSha = treeData.sha;
      break;
    } catch (err) {
      if (attempt === 3) {
        throw new Error(`Failed to create Git tree: ${formatOctokitError(err)}`);
      }
      onLog?.(`Waiting for repository tree object store to sync (attempt ${attempt}/3)...`);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }

  // 7. Create Commit
  let commitSha = "";
  try {
    const { data: commitData } = await octokit.git.createCommit({
      owner: workOwner,
      repo: workRepo,
      message:
        "docs(saaya): generate comprehensive RepoWiki knowledge base [skip ci]",
      tree: treeSha,
      parents: [latestCommitSha],
    });
    commitSha = commitData.sha;
  } catch (err) {
    throw new Error(`Failed to create Git commit: ${formatOctokitError(err)}`);
  }

  // 8. Create Branch Ref pointing directly to the new commit
  const branchName = `docs/saaya-repowiki-${Date.now()}`;
  try {
    await octokit.git.createRef({
      owner: workOwner,
      repo: workRepo,
      ref: `refs/heads/${branchName}`,
      sha: commitSha,
    });
    onLog?.(`Branch created: ${branchName} with ${treeItems.length} files`);
  } catch (err) {
    throw new Error(`Failed to create Git branch ref: ${formatOctokitError(err)}`);
  }

  // 9. Create Pull Request (with retries for cross-fork branch propagation)
  let prUrl = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data: prData } = await octokit.pulls.create({
        owner, // target original repo
        repo,
        title: "🛡️ Add Auto-Generated Saaya RepoWiki Knowledge Base",
        head: `${headPrefix}${branchName}`,
        base: defaultBranch,
        body: `## 🛡️ Saaya RepoWiki Documentation

This PR introduces a comprehensive, pre-indexed knowledge base and architectural documentation suite generated under \`.saaya/repowiki/\`.

### Included Documentation:
- 🏗️ **System Architecture & Tech Stack Matrix**
- 🔌 **Backend & Frontend API Specifications**
- ⚡ **Background Workers & Async Queue Pipelines**
- 🗄️ **Database Schemas & Migrations**
- 📦 **Shared Package Documentation**
- 📖 **Getting Started & Contributing Guides**
- 🧩 **Modular Code Knowledge Cards (\`knowledge/en/\`)**

### Structure:
\`\`\`
.saaya/repowiki/
├── en/content/          # Human-readable articles with citations & Mermaid diagrams
├── en/meta/             # repowiki-metadata.json (knowledge graph)
└── knowledge/en/        # 6-file module cards + standalone tech cards
\`\`\`

### Stats:
- **${treeItems.length} files** generated
- Generated by **@${username}** via Saaya

---
*Generated by [Saaya](https://code-saaya.vercel.app) — AI Repository Knowledge Generator*`,
      });
      prUrl = prData.html_url;
      break;
    } catch (err) {
      if (attempt === 3) {
        throw new Error(`Failed to create Pull Request: ${formatOctokitError(err)}`);
      }
      onLog?.(`Waiting for pull request branch to propagate on GitHub (attempt ${attempt}/3)...`);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }

  onLog?.(`✅ PR created: ${prUrl}`);
  return prUrl;
}

/**
 * Wait for a fork to be ready (GitHub creates forks asynchronously)
 */
async function waitForFork(
  octokit: Octokit,
  owner: string,
  repo: string,
  maxAttempts = 10
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await octokit.repos.get({ owner, repo });
      return; // Fork is ready
    } catch {
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
  throw new Error(`Fork ${owner}/${repo} not ready after ${maxAttempts} attempts`);
}
