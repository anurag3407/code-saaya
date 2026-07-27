import { Octokit } from "@octokit/rest";
import type { RepoFileInfo } from "@/types/saaya";

const CONFIG_FILES = [
  "package.json",
  "README.md",
  "docker-compose.yml",
  "tsconfig.json",
  "turbo.json",
  "pnpm-workspace.yaml",
  ".env.example",
  "next.config.ts",
  "next.config.js",
  "next.config.mjs",
  "drizzle.config.ts",
  "prisma/schema.prisma",
];

/**
 * Scans a GitHub repository and returns its file tree + key config files & sampled source code files
 */
export async function scanRepository(
  githubToken: string | undefined,
  owner: string,
  repo: string
): Promise<{ fileTree: RepoFileInfo[]; configFiles: Record<string, string> }> {
  // Sanitize token (remove quotes, whitespace)
  const cleanToken = githubToken?.trim().replace(/^["']|["']$/g, "");
  
  let octokit = cleanToken
    ? new Octokit({ auth: cleanToken, userAgent: "code-saaya/v1.0.0" })
    : new Octokit({ userAgent: "code-saaya/v1.0.0" });

  let repoData;
  try {
    const { data } = await octokit.repos.get({ owner, repo });
    repoData = data;
  } catch (err: any) {
    if (err?.status === 401 && cleanToken) {
      console.warn(`[scanRepository] Authenticated request returned 401. Retrying unauthenticated...`);
      octokit = new Octokit({ userAgent: "code-saaya/v1.0.0" });
      const { data } = await octokit.repos.get({ owner, repo });
      repoData = data;
    } else {
      throw err;
    }
  }

  const defaultBranch = repoData.default_branch;

  const { data: treeData } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: defaultBranch,
    recursive: "true",
  });

  const fileTree: RepoFileInfo[] = (treeData.tree || [])
    .filter((item) => item.type === "blob" || item.type === "tree")
    .map((item) => ({
      path: item.path!,
      type: item.type === "tree" ? ("dir" as const) : ("file" as const),
      size: item.size,
    }));

  const configFiles: Record<string, string> = {};

  // 1. Fetch key config files
  const filePromises = CONFIG_FILES.map(async (filePath) => {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: defaultBranch,
      });

      if ("content" in data && data.content) {
        configFiles[filePath] = Buffer.from(data.content, "base64").toString("utf-8");
      }
    } catch {
      // File doesn't exist — skip
    }
  });

  await Promise.allSettled(filePromises);

  // 2. Scan for workspace packages and sub-package.json files
  const subFilesToSample = fileTree
    .filter((f) => f.type === "file")
    .map((f) => f.path)
    .filter(
      (p) =>
        p.endsWith("package.json") ||
        p.includes("schema") ||
        p.includes("routes") ||
        p.includes("controller") ||
        p.includes("service") ||
        p.includes("worker") ||
        p.endsWith(".prisma")
    )
    .slice(0, 30); // Up to 30 strategic source code samples

  const samplePromises = subFilesToSample.map(async (filePath) => {
    if (configFiles[filePath]) return;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: defaultBranch,
      });
      if ("content" in data && data.content) {
        const raw = Buffer.from(data.content, "base64").toString("utf-8");
        // Truncate to first 2500 chars to conserve context space
        configFiles[filePath] = raw.length > 2500 ? raw.slice(0, 2500) + "\n...[truncated]" : raw;
      }
    } catch {
      // skip
    }
  });

  await Promise.allSettled(samplePromises);

  return { fileTree, configFiles };
}

/**
 * Parses a GitHub URL into owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(
    /github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/
  );
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }
  return { owner: match[1], repo: match[2] };
}
