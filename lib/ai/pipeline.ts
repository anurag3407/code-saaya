import { StateGraph, Annotation, END } from "@langchain/langgraph";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import type {
  RepoFileInfo,
  ModuleNode,
  CatalogNode,
  GeneratedFile,
} from "@/types/saaya";
import { RateLimitedTaskQueue } from "./rate-limiter";

// ─── Pipeline State Annotation ─────────────────────────────────────────────────

const PipelineState = Annotation.Root({
  jobId: Annotation<string>,
  owner: Annotation<string>,
  repo: Annotation<string>,
  githubToken: Annotation<string>,
  model: Annotation<string>,
  aiClient: Annotation<OpenAI>,
  queue: Annotation<RateLimitedTaskQueue>,
  fileTree: Annotation<RepoFileInfo[]>,
  configFiles: Annotation<Record<string, string>>,
  taxonomy: Annotation<ModuleNode[]>,
  catalogs: Annotation<CatalogNode[]>,
  generatedCards: Annotation<GeneratedFile[]>,
  generatedArticles: Annotation<GeneratedFile[]>,
  metadata: Annotation<Record<string, unknown>>,
  pullRequestUrl: Annotation<string | undefined>,
  error: Annotation<string | undefined>,
  progress: Annotation<number>,
  currentStep: Annotation<string>,
  onProgress: Annotation<((step: string, progress: number) => void) | undefined>,
});

type PipelineStateType = typeof PipelineState.State;

// ─── Node: Taxonomy Planner ────────────────────────────────────────────────────

async function planTaxonomy(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { aiClient, model, fileTree, configFiles, queue, onProgress } = state;
  onProgress?.("Planning taxonomy from repository structure...", 15);

  const treeSummary = fileTree
    .filter((f) => f.type === "dir")
    .slice(0, 200)
    .map((f) => f.path)
    .join("\n");

  const configSummary = Object.entries(configFiles)
    .map(([path, content]) => `### ${path}\n${content.slice(0, 2000)}`)
    .join("\n\n");

  const prompt = `You are a repository architecture analyst. Given the directory structure and configuration files below, generate a module taxonomy in JSON format.

## Directory Structure:
${treeSummary}

## Configuration Files:
${configSummary}

## Output Format:
Return a JSON array of module objects. Each module:
{
  "module_path": "api/auth",
  "dir_name": "Authentication Module",
  "title": "Authentication & Authorization",
  "scope": ["src/auth/"],
  "source_files": [],
  "children": [],
  "depends_on": [],
  "related_to": [{"path": "api/common"}]
}

Rules:
- Root module has module_path "" 
- Group related directories into logical modules
- Maximum 3 levels of nesting
- Include scope globs that cover the module's files
- Identify cross-module dependencies in related_to
- Return ONLY valid JSON array, no markdown fences`;

  const result = await queue.enqueue(async () => {
    const response = await aiClient.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 4096,
    });
    return response.choices[0]?.message?.content || "[]";
  });

  let taxonomy: ModuleNode[] = [];
  try {
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    taxonomy = JSON.parse(cleaned);
  } catch {
    // Fallback: create a single root module
    taxonomy = [{
      module_path: "",
      dir_name: state.repo,
      title: state.repo,
      scope: ["**"],
      source_files: [],
      children: [],
      depends_on: [],
      related_to: [],
    }];
  }

  onProgress?.(`Identified ${taxonomy.length} modules`, 25);
  return { taxonomy, progress: 25, currentStep: "Taxonomy planned" };
}

// ─── Node: Catalog Generator ───────────────────────────────────────────────────

async function generateCatalogs(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { aiClient, model, taxonomy, configFiles, queue, onProgress } = state;
  onProgress?.("Generating documentation catalog...", 30);

  const moduleSummary = taxonomy
    .map((m) => `- ${m.module_path || "(root)"}: ${m.title} [scope: ${m.scope.join(", ")}]`)
    .join("\n");

  const prompt = `You are a documentation architect. Given the module taxonomy below, generate a documentation catalog — a list of articles to write.

## Modules:
${moduleSummary}

## Config context:
${Object.keys(configFiles).join(", ")}

## Output Format:
Return a JSON array of catalog entries:
{
  "id": "uuid-string",
  "name": "Getting Started",
  "description": "getting-started",
  "prompt": "Detailed prompt for writing this article...",
  "dependent_files": "README.md,package.json",
  "progress_status": "pending"
}

Rules:
- Always include: Getting Started, Architecture Overview, Technology Stack
- One article per major module group
- Include sub-articles for complex modules (e.g. "Chat & Messaging API" > "WebSocket Real-time")
- The "prompt" field should be a detailed instruction for writing that article
- Return ONLY valid JSON array`;

  const result = await queue.enqueue(async () => {
    const response = await aiClient.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    });
    return response.choices[0]?.message?.content || "[]";
  });

  let catalogs: CatalogNode[] = [];
  try {
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    catalogs = JSON.parse(cleaned);
    catalogs = catalogs.map((c) => ({ ...c, id: c.id || uuidv4() }));
  } catch {
    catalogs = [{
      id: uuidv4(),
      name: "Getting Started",
      description: "getting-started",
      prompt: "Write a comprehensive getting started guide",
      dependent_files: "README.md,package.json",
      progress_status: "pending",
    }];
  }

  onProgress?.(`Planned ${catalogs.length} articles`, 35);
  return { catalogs, progress: 35, currentStep: "Catalog generated" };
}

// ─── Node: Module Card Generator ───────────────────────────────────────────────

async function generateModuleCards(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { aiClient, model, taxonomy, fileTree, queue, onProgress } = state;
  onProgress?.("Generating 6-file module knowledge cards...", 40);

  const generatedCards: GeneratedFile[] = [];
  const modules = taxonomy.slice(0, 30); // Limit to avoid excessive API calls

  // Process in parallel batches — the queue handles actual concurrency
  const batchSize = Math.max(queue.active <= 0 ? 4 : 2, 2);
  for (let batchStart = 0; batchStart < modules.length; batchStart += batchSize) {
    const batch = modules.slice(batchStart, batchStart + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (mod, batchIdx) => {
        const i = batchStart + batchIdx;
        const dirPrefix = mod.dir_name.replace(/[/\\:*?"<>|]/g, "_");
        const moduleDir = mod.module_path
          ? `knowledge/en/${modules[0]?.dir_name || state.repo}/${dirPrefix}`
          : `knowledge/en/${dirPrefix}`;

        const scopeFiles = fileTree
          .filter((f) => mod.scope.some((s) => f.path.startsWith(s.replace(/\/$/, ""))))
          .slice(0, 50)
          .map((f) => f.path);

        const cardPrompt = `Generate documentation for the module "${mod.title}" (path: ${mod.module_path || "root"}).
Scope files: ${scopeFiles.slice(0, 20).join(", ")}

Generate ALL 6 files as a JSON object with keys: overview, architecture_design, tech_stack, coding_conventions, unique_setup_and_commands, module_yaml.

- overview: 1-2 sentence summary
- architecture_design: Structural patterns, layering, boundaries (2-3 paragraphs)
- tech_stack: Frameworks and libraries used (bullet list)
- coding_conventions: Style rules, naming, error handling (bullet list)
- unique_setup_and_commands: Build/run/test commands (code blocks)
- module_yaml: YAML string with schema_version: 1, module_path, title, scope, source_files: [], depends_on: [], related_to: []

Return ONLY valid JSON.`;

        const result = await queue.enqueue(async () => {
          const response = await aiClient.chat.completions.create({
            model,
            messages: [{ role: "user", content: cardPrompt }],
            temperature: 0.2,
            max_tokens: 3000,
          });
          return response.choices[0]?.message?.content || "{}";
        });

        try {
          const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const cards = JSON.parse(cleaned);
          const pct = 40 + Math.round((i / modules.length) * 25);
          onProgress?.(`Card ${i + 1}/${modules.length}: ${mod.title}`, pct);
          return [
            { path: `${moduleDir}/overview.md`, content: cards.overview || "" },
            { path: `${moduleDir}/architecture_design.md`, content: cards.architecture_design || "" },
            { path: `${moduleDir}/tech_stack.md`, content: cards.tech_stack || "" },
            { path: `${moduleDir}/coding_conventions.md`, content: cards.coding_conventions || "" },
            { path: `${moduleDir}/unique_setup_and_commands.md`, content: cards.unique_setup_and_commands || "" },
            { path: `${moduleDir}/_module.yaml`, content: cards.module_yaml || "" },
          ] as GeneratedFile[];
        } catch {
          return [] as GeneratedFile[];
        }
      })
    );

    for (const files of batchResults) {
      generatedCards.push(...files);
    }
  }

  return { generatedCards, progress: 65, currentStep: "Module cards generated" };
}

// ─── Node: Article Writer ──────────────────────────────────────────────────────

async function writeArticles(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { aiClient, model, catalogs, configFiles, queue, onProgress } = state;
  onProgress?.("Writing documentation articles...", 70);

  const generatedArticles: GeneratedFile[] = [];
  const articles = catalogs.slice(0, 20); // Limit

  // Process articles in parallel batches
  const batchSize = Math.max(queue.active <= 0 ? 4 : 2, 2);
  for (let batchStart = 0; batchStart < articles.length; batchStart += batchSize) {
    const batch = articles.slice(batchStart, batchStart + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (catalog, batchIdx) => {
        const i = batchStart + batchIdx;

        const articlePrompt = `Write a comprehensive documentation article titled "${catalog.name}".

Instructions: ${catalog.prompt}

Context files available: ${catalog.dependent_files}
Config content:
${Object.entries(configFiles)
  .filter(([path]) => catalog.dependent_files.includes(path))
  .map(([path, content]) => `### ${path}\n${content.slice(0, 1500)}`)
  .join("\n\n")}

## FORMAT REQUIREMENTS:
1. Start with a <cite> block listing referenced files:
<cite>
**Referenced Files in This Document**
- [file.ts](file://path/to/file.ts)
</cite>

2. Include a ## Table of Contents with numbered anchor links
3. Use ## for major sections
4. Include at least one mermaid diagram (graph TB or sequenceDiagram)
5. End each section with **Section sources** listing file paths
6. Be thorough, technical, and precise

Return the complete Markdown article.`;

        const result = await queue.enqueue(async () => {
          const response = await aiClient.chat.completions.create({
            model,
            messages: [{ role: "user", content: articlePrompt }],
            temperature: 0.3,
            max_tokens: 4096,
          });
          return response.choices[0]?.message?.content || "";
        });

        const pct = 70 + Math.round((i / articles.length) * 20);
        onProgress?.(`Article ${i + 1}/${articles.length}: ${catalog.name}`, pct);

        return {
          path: `en/content/${catalog.name}.md`,
          content: result,
        } as GeneratedFile;
      })
    );

    generatedArticles.push(...batchResults);
  }

  return { generatedArticles, progress: 90, currentStep: "Articles written" };
}

// ─── Node: Metadata Linker ─────────────────────────────────────────────────────

async function buildMetadata(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { catalogs, generatedArticles, taxonomy } = state;

  const wikiCatalogs = catalogs.map((c) => ({
    id: c.id,
    repo_id: state.jobId,
    name: c.name,
    description: c.description,
    prompt: c.prompt,
    progress_status: "completed",
    dependent_files: c.dependent_files,
    gmt_create: new Date().toISOString(),
    gmt_modified: new Date().toISOString(),
  }));

  const wikiItems = generatedArticles.map((a, i) => ({
    catalog_id: catalogs[i]?.id || uuidv4(),
    title: a.path.split("/").pop()?.replace(".md", "") || "",
    description: "",
    extend: "{}",
    progress_status: "completed",
    repo_id: state.jobId,
    reference_count: 0,
    id: uuidv4(),
    gmt_create: new Date().toISOString(),
    gmt_modified: new Date().toISOString(),
  }));

  // Build _index.yaml content
  const indexYaml = [
    "schema_version: 1",
    "locale: en-US",
    "branch: main",
    "nodes_managed: true",
    `exported_at: "${new Date().toISOString()}"`,
    "modules:",
    ...taxonomy.map((m) => [
      `    "${m.module_path}":`,
      `        dir_name: ${m.dir_name}`,
      `        title: ${m.title}`,
      `        scope:`,
      ...m.scope.map((s) => `            - ${s}`),
      `        source_files: []`,
      `        children: [${m.children.join(", ")}]`,
      `        depends_on: [${m.depends_on.join(", ")}]`,
      `        related_to: [${m.related_to.map((r) => `{path: ${r.path}}`).join(", ")}]`,
    ]).flat(),
  ].join("\n");

  const metadata = {
    knowledge_relations: [],
    wiki_catalogs: wikiCatalogs,
    wiki_items: wikiItems,
    wiki_overview: { content: `# ${state.repo}\nAuto-generated knowledge base.`, id: uuidv4(), repo_id: state.jobId },
    wiki_readme: { content: state.configFiles["README.md"] || "", id: uuidv4(), repo_id: state.jobId },
    wiki_repo: { id: state.jobId, name: state.repo, progress_status: "completed", wiki_present_status: "COMPLETED" },
  };

  const metadataFiles: GeneratedFile[] = [
    { path: "en/meta/repowiki-metadata.json", content: JSON.stringify(metadata, null, 2) },
    { path: "knowledge/en/_index.yaml", content: indexYaml },
  ];

  return {
    metadata,
    generatedCards: [...state.generatedCards, ...metadataFiles],
    progress: 95,
    currentStep: "Metadata linked",
  };
}

// ─── Graph Construction ────────────────────────────────────────────────────────

export function buildPipelineGraph() {
  const graph = new StateGraph(PipelineState)
    .addNode("planTaxonomy", planTaxonomy)
    .addNode("generateCatalogs", generateCatalogs)
    .addNode("generateModuleCards", generateModuleCards)
    .addNode("writeArticles", writeArticles)
    .addNode("buildMetadata", buildMetadata)
    .addEdge("__start__", "planTaxonomy")
    .addEdge("planTaxonomy", "generateCatalogs")
    .addEdge("generateCatalogs", "generateModuleCards")
    .addEdge("generateModuleCards", "writeArticles")
    .addEdge("writeArticles", "buildMetadata")
    .addEdge("buildMetadata", END);

  return graph.compile();
}
