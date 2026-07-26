import { Octokit } from "@octokit/rest";
import type { GeneratedFile } from "@/types/saaya";

/**
 * Cross-repo PR automation:
 * 1. Check if the user has push access to the target repo
 * 2. If YES → create branch + commit + PR directly
 * 3. If NO  → fork the repo → create branch on fork → PR from fork to upstream
 *
 * All operations use the developer's own GitHub token.
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

  // Get authenticated user's username
  const { data: user } = await octokit.users.getAuthenticated();
  const username = user.login;
  onLog?.(`Authenticated as @${username}`);

  // 1. Get target repo info
  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const defaultBranch = repoData.default_branch;

  // 2. Check if user has push access
  const hasPushAccess =
    repoData.permissions?.push || repoData.permissions?.admin || false;

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
      // Verify it's actually a fork of the target
      if (existingFork.fork && existingFork.parent?.full_name === `${owner}/${repo}`) {
        forkData = existingFork;
        onLog?.(`Using existing fork: ${username}/${repo}`);
      }
    } catch {
      // Fork doesn't exist
    }

    if (!forkData) {
      const { data: newFork } = await octokit.repos.createFork({
        owner,
        repo,
      });
      forkData = newFork;
      onLog?.(`Fork created: ${username}/${repo}`);

      // Wait for fork to be ready (GitHub forks are async)
      await waitForFork(octokit, username, repo);
    }

    workOwner = username;
    workRepo = repo;
    headPrefix = `${username}:`;
  }

  // 3. Get latest commit SHA on the working repo
  const { data: refData } = await octokit.git.getRef({
    owner: workOwner,
    repo: workRepo,
    ref: `heads/${defaultBranch}`,
  });
  const latestCommitSha = refData.object.sha;

  // 4. Create branch
  const branchName = `docs/saaya-repowiki-${Date.now()}`;
  await octokit.git.createRef({
    owner: workOwner,
    repo: workRepo,
    ref: `refs/heads/${branchName}`,
    sha: latestCommitSha,
  });
  onLog?.(`Branch created: ${branchName}`);

  // 5. Create tree with all generated files
  const treeItems = saayaFiles.map((file) => ({
    path: `.saaya/repowiki/${file.path}`,
    mode: "100644" as const,
    type: "blob" as const,
    content: file.content,
  }));

  const { data: treeData } = await octokit.git.createTree({
    owner: workOwner,
    repo: workRepo,
    base_tree: latestCommitSha,
    tree: treeItems,
  });

  // 6. Create commit
  const { data: commitData } = await octokit.git.createCommit({
    owner: workOwner,
    repo: workRepo,
    message:
      "docs(saaya): generate comprehensive RepoWiki knowledge base [skip ci]",
    tree: treeData.sha,
    parents: [latestCommitSha],
  });

  // 7. Update branch ref to new commit
  await octokit.git.updateRef({
    owner: workOwner,
    repo: workRepo,
    ref: `heads/${branchName}`,
    sha: commitData.sha,
  });
  onLog?.(`Committed ${saayaFiles.length} files`);

  // 8. Create Pull Request (always targets the ORIGINAL repo)
  const { data: prData } = await octokit.pulls.create({
    owner, // PR target = original repo
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
- **${saayaFiles.length} files** generated
- Generated by **@${username}** via Saaya

---
*Generated by [Saaya](https://code-saaya.vercel.app) — AI Repository Knowledge Generator*`,
  });

  onLog?.(`✅ PR created: ${prData.html_url}`);
  return prData.html_url;
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
