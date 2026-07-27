import OpenAI from "openai";
import type { GeneratedFile, RepoFileInfo } from "@/types/saaya";
import { RateLimitedTaskQueue } from "./rate-limiter";

export interface TechTopic {
  name: string;
  category: string;
  description: string;
  files: string[];
}

/**
 * Auto-discovers technology topics from package dependencies, configuration files, and source trees.
 */
export async function discoverTechTopics(
  aiClient: OpenAI,
  model: string,
  configFiles: Record<string, string>,
  fileTree: RepoFileInfo[],
  queue: RateLimitedTaskQueue
): Promise<TechTopic[]> {
  const filePaths = fileTree.map((f) => f.path).join("\n");
  const configSummaries = Object.entries(configFiles)
    .map(([path, content]) => `### ${path}\n${content.slice(0, 1500)}`)
    .join("\n\n");

  const prompt = `You are a principal software architect. Analyze the repository structure, config files, and dependencies below. Identify all key technology stack components, third-party services, databases, ORMs, authentication mechanisms, message queues, AI models, and core infrastructure topics present in this project.

## File Tree Sample:
${filePaths.slice(0, 3000)}

## Configuration Files & Dependencies:
${configSummaries}

## Instructions:
Generate a JSON array of 15-25 specific, granular tech-stack knowledge topics.
Each item must have:
- "name": Short, descriptive technology topic title (e.g. "PostgreSQL Database & Drizzle ORM", "Redis Caching & Queue Management", "Better Auth Authentication", "Realtime Messaging with Pusher", "Anthropic Claude Router", "Build Orchestration (Turborepo)", "NestJS Global Exception Filter")
- "category": Category string (e.g. "Database", "Caching", "Auth", "Messaging", "AI", "DevOps", "Framework")
- "description": Brief 1-2 sentence description of how this tech is used in the project
- "files": Array of relevant file paths or glob patterns in the repository that implement or configure this tech

Return ONLY a valid JSON array of objects.`;

  try {
    const result = await queue.enqueue(async () => {
      const response = await aiClient.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 4096,
      });
      return response?.choices?.[0]?.message?.content || "[]";
    });

    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any) => ({
        name: String(item.name || "Tech Topic"),
        category: String(item.category || "General"),
        description: String(item.description || ""),
        files: Array.isArray(item.files) ? item.files.map(String) : [],
      }));
    }
  } catch (err) {
    console.warn("[discoverTechTopics] Failed to parse tech topics from LLM, falling back to defaults", err);
  }

  return [
    {
      name: "Monorepo Build & Orchestration",
      category: "DevOps",
      description: "Monorepo workspace configuration and build pipeline management",
      files: ["package.json", "turbo.json", "pnpm-workspace.yaml"],
    },
  ];
}

/**
 * Generates a 6-file documentation suite for a specific tech topic.
 */
export async function generateTechModuleSuite(
  aiClient: OpenAI,
  model: string,
  topic: TechTopic,
  configFiles: Record<string, string>,
  repoName: string,
  queue: RateLimitedTaskQueue
): Promise<GeneratedFile[]> {
  const safeDirName = topic.name.replace(/[/\\:*?"<>|]/g, "_").trim();
  const moduleDir = `knowledge/en/${safeDirName}`;

  const prompt = `Generate a comprehensive 6-file technical documentation suite for the technology topic "${topic.name}" in project "${repoName}".

Description: ${topic.description}
Relevant files: ${topic.files.join(", ")}

Config context:
${Object.entries(configFiles)
  .slice(0, 5)
  .map(([path, content]) => `### ${path}\n${content.slice(0, 1000)}`)
  .join("\n\n")}

Generate ALL 6 files as a single JSON object with these keys:
- overview: 2-3 paragraph overview of how ${topic.name} is configured and used
- architecture_design: Structural design, integration patterns, layering, and data flow
- tech_stack: Libraries, packages, version constraints, and ecosystem details (bullet list & code blocks)
- coding_conventions: Code patterns, file locations, error handling, and naming conventions for this tech
- unique_setup_and_commands: Setup steps, env variables, local docker, build/test commands
- module_yaml: YAML string containing schema_version: 1, title: "${topic.name}", scope: ${JSON.stringify(topic.files)}

Return ONLY valid JSON.`;

  try {
    const result = await queue.enqueue(async () => {
      const response = await aiClient.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 4096,
      });
      return response?.choices?.[0]?.message?.content || "{}";
    });

    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const cards = JSON.parse(cleaned);

    return [
      { path: `${moduleDir}/overview.md`, content: cards.overview || `# ${topic.name}\n\nOverview documentation.` },
      { path: `${moduleDir}/architecture_design.md`, content: cards.architecture_design || `# Architecture & Design\n\nDesign documentation.` },
      { path: `${moduleDir}/tech_stack.md`, content: cards.tech_stack || `# Tech Stack\n\nStack details.` },
      { path: `${moduleDir}/coding_conventions.md`, content: cards.coding_conventions || `# Coding Conventions\n\nConventions.` },
      { path: `${moduleDir}/unique_setup_and_commands.md`, content: cards.unique_setup_and_commands || `# Setup & Commands\n\nSetup commands.` },
      { path: `${moduleDir}/_module.yaml`, content: cards.module_yaml || `schema_version: 1\ntitle: "${topic.name}"` },
    ];
  } catch (err) {
    console.error(`[generateTechModuleSuite] Failed for topic ${topic.name}`, err);
    return [];
  }
}
