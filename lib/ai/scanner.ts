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
];

/**
 * Scans a GitHub repository and returns its file tree + key config files
 */
export async function scanRepository(
  githubToken: string | undefined,
  owner: string,
  repo: string
): Promise<{ fileTree: RepoFileInfo[]; configFiles: Record<string, string> }> {
  const token = githubToken?.trim();
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  // 1. Get the full recursive tree
  const { data: repoData } = await octokit.repos.get({ owner, repo });
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

  // 2. Fetch key config files content
  const configFiles: Record<string, string> = {};

  const filePromises = CONFIG_FILES.map(async (filePath) => {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: defaultBranch,
      });

      if ("content" in data && data.content) {
        configFiles[filePath] = Buffer.from(data.content, "base64").toString(
          "utf-8"
        );
      }
    } catch {
      // File doesn't exist — skip
    }
  });

  await Promise.allSettled(filePromises);

  // 3. Also scan for monorepo workspace packages
  const workspaceDirs = fileTree
    .filter(
      (f) =>
        f.type === "file" &&
        (f.path.match(/^(apps|packages|libs)\/[^/]+\/package\.json$/) ||
          f.path.match(/^apps\/[^/]+\/src\/$/))
    )
    .map((f) => f.path);

  // Fetch sub-package.json files for monorepo awareness
  const subPackagePromises = workspaceDirs
    .filter((p) => p.endsWith("package.json"))
    .slice(0, 20) // Limit to avoid rate limits
    .map(async (filePath) => {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref: defaultBranch,
        });
        if ("content" in data && data.content) {
          configFiles[filePath] = Buffer.from(
            data.content,
            "base64"
          ).toString("utf-8");
        }
      } catch {
        // skip
      }
    });

  await Promise.allSettled(subPackagePromises);

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
