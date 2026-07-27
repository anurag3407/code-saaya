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
import { discoverTechTopics, generateTechModuleSuite } from "./tech-extractor";

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
  onCheckpoint: Annotation<((checkpoint: Record<string, any>) => void) | undefined>,
});

type PipelineStateType = typeof PipelineState.State;

// ─── Node: Taxonomy Planner ────────────────────────────────────────────────────

async function planTaxonomy(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { aiClient, model, fileTree, configFiles, queue, onProgress } = state;
  
  if (state.taxonomy && state.taxonomy.length > 0) {
    onProgress?.(`Reusing ${state.taxonomy.length} modules from checkpoint`, 25);
    return { taxonomy: state.taxonomy, progress: 25, currentStep: "Taxonomy planned" };
  }

  onProgress?.("Planning multi-pass domain taxonomy from repository structure...", 15);

  const treeSummary = fileTree
    .map((f) => f.path)
    .slice(0, 300)
    .join("\n");

  const configSummary = Object.entries(configFiles)
    .slice(0, 10)
    .map(([path, content]) => `### ${path}\n${content.slice(0, 1500)}`)
    .join("\n\n");

  const prompt = `You are a principal repository architecture analyst. Given the file tree and config files below, generate a rich, multi-tiered module taxonomy for this project in JSON format.

## File Tree Sample:
${treeSummary}

## Key Configs & Source Samples:
${configSummary}

## Output Format:
Return a JSON array of module objects. Group files logically into functional modules (e.g., Core API, Auth Module, Database/ORM, Background Queues, UI Components, Integrations, DevOps Pipeline, Analytics, etc.).

Return JSON objects matching:
{
  "module_path": "backend/api",
  "dir_name": "Backend API",
  "title": "Backend API Service",
  "scope": ["src/api/"],
  "source_files": [],
  "children": ["backend/api/auth", "backend/api/chat"],
  "depends_on": ["core/db"],
  "related_to": [{"path": "core/shared"}]
}

Rules:
- Identify top-level domains AND sub-modules (up to 3 levels deep).
- Provide clean module_path, title, scope globs, and relationships.
- Return ONLY valid JSON array.`;

  const result = await queue.enqueue(async () => {
    const response = await aiClient.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 4096,
    });
    return response?.choices?.[0]?.message?.content || "[]";
  });

  let taxonomy: ModuleNode[] = [];
  try {
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const rawParsed = JSON.parse(cleaned);
    const rawArray = Array.isArray(rawParsed) ? rawParsed : [rawParsed];
    taxonomy = rawArray.map((m: any) => ({
      module_path: typeof m?.module_path === "string" ? m.module_path : "",
      dir_name: typeof m?.dir_name === "string" ? m.dir_name : m?.title || state.repo,
      title: typeof m?.title === "string" ? m.title : m?.dir_name || state.repo,
      scope: Array.isArray(m?.scope) ? m.scope : ["**"],
      source_files: Array.isArray(m?.source_files) ? m.source_files : [],
      children: Array.isArray(m?.children) ? m.children : [],
      depends_on: Array.isArray(m?.depends_on) ? m.depends_on : [],
      related_to: Array.isArray(m?.related_to) ? m.related_to : [],
    }));
  } catch {
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

  onProgress?.(`Identified ${taxonomy.length} taxonomy modules`, 25);
  return { taxonomy, progress: 25, currentStep: "Taxonomy planned" };
}

// ─── Node: Catalog Generator ───────────────────────────────────────────────────

async function generateCatalogs(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { aiClient, model, taxonomy, configFiles, queue, onProgress } = state;

  if (state.catalogs && state.catalogs.length > 0) {
    onProgress?.(`Reusing ${state.catalogs.length} planned articles from checkpoint`, 35);
    return { catalogs: state.catalogs, progress: 35, currentStep: "Catalog generated" };
  }

  onProgress?.("Generating hierarchical documentation catalog (50+ nested sub-articles)...", 30);

  const moduleSummary = (taxonomy || [])
    .map((m) => `- ${m.module_path || "(root)"}: ${m.title || "Module"} [scope: ${(m.scope || []).join(", ")}]`)
    .join("\n");

  const prompt = `You are a principal documentation architect. Design an exhaustive, multi-tier documentation catalog for project "${state.repo}".

## Module Taxonomy:
${moduleSummary}

## Available Configs:
${Object.keys(configFiles).join(", ")}

## Requirements:
Generate a JSON array of 40 to 80 detailed documentation articles organized into functional domain folders:
1. Core Guides: Getting Started, Deployment & DevOps, Contributing Guide, Testing Strategy, Troubleshooting & FAQ
2. Architecture Overview: System Architecture, Technology Stack, Data Flow & Processing, Real-time Communication
3. Database Schema: Core Entities, Migrations, Billing & Subscriptions, Analytics Data, Knowledge Base Schema
4. Backend API: REST Endpoints, Authentication & Authorization, Webhooks API, Workspaces API, Integrations API, Chat REST API, WebSocket API
5. Background Workers: Worker Architecture, Job Processing System, Content Processors (Crawler, Extraction), Message Processors, Channel Adapters (WhatsApp, Instagram)
6. Frontend Applications: Dashboard Application (Architecture, Settings, Auth, Chat UI, Analytics), Chat Widget, Marketing Website
7. Shared Packages: Database Package, Core Package, UI Package, AI Package, Configuration Package
8. Security & Compliance: Authentication & Authorization, Rate Limiting, Encryption, Audit Logging

Each entry must have:
{
  "id": "uuid-string",
  "name": "Database Schema/Core Entities",
  "description": "core-entities-schema",
  "prompt": "Detailed instructions on what code schemas, tables, and relations to document in this sub-article...",
  "dependent_files": "drizzle.config.ts,package.json",
  "progress_status": "pending"
}

Return ONLY valid JSON array.`;

  const result = await queue.enqueue(async () => {
    const response = await aiClient.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 8192,
    });
    return response?.choices?.[0]?.message?.content || "[]";
  });

  let catalogs: CatalogNode[] = [];
  try {
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const rawParsed = JSON.parse(cleaned);
    const rawArray = Array.isArray(rawParsed) ? rawParsed : [rawParsed];
    catalogs = rawArray.map((c: any) => ({
      id: c?.id || uuidv4(),
      name: String(c?.name || "Getting Started"),
      description: String(c?.description || ""),
      prompt: String(c?.prompt || `Write comprehensive documentation for ${c?.name}`),
      dependent_files: typeof c?.dependent_files === "string" ? c.dependent_files : Array.isArray(c?.dependent_files) ? c.dependent_files.join(",") : "README.md,package.json",
      progress_status: "pending",
    }));
  } catch {
    catalogs = [
      { id: uuidv4(), name: "Getting Started", description: "getting-started", prompt: "Write getting started guide", dependent_files: "README.md", progress_status: "pending" },
      { id: uuidv4(), name: "Architecture Overview/System Architecture", description: "system-architecture", prompt: "Write system architecture guide", dependent_files: "README.md", progress_status: "pending" },
    ];
  }

  onProgress?.(`Planned ${catalogs.length} articles across nested domain folders`, 35);
  return { catalogs, progress: 35, currentStep: "Catalog generated" };
}

// ─── Node: Tech Module & Knowledge Card Generator ──────────────────────────────

async function generateModuleCards(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { aiClient, model, fileTree, configFiles, queue, onProgress, onCheckpoint } = state;

  const existingMap = new Map<string, GeneratedFile>();
  if (state.generatedCards) {
    for (const card of state.generatedCards) {
      if (card?.path) existingMap.set(card.path, card);
    }
  }

  const generatedCards: GeneratedFile[] = Array.from(existingMap.values());

  onProgress?.("Discovering tech-stack components & generating knowledge module suites...", 40);

  // 1. Auto-discover technology topics (Postgres, Redis, Auth, Monorepo, AI, Queues, etc.)
  const techTopics = await discoverTechTopics(aiClient, model, configFiles, fileTree, queue);
  onProgress?.(`Discovered ${techTopics.length} technology stack topics`, 45);

  // 2. Generate 6-file module suites for each discovered tech topic
  const batchSize = Math.max(queue.active <= 0 ? 4 : 2, 2);
  for (let batchStart = 0; batchStart < techTopics.length; batchStart += batchSize) {
    const batch = techTopics.slice(batchStart, batchStart + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (topic, batchIdx) => {
        const i = batchStart + batchIdx;
        const pct = 45 + Math.round((i / techTopics.length) * 20);
        onProgress?.(`Generating 6-file knowledge suite ${i + 1}/${techTopics.length}: ${topic.name}`, pct);
        return generateTechModuleSuite(aiClient, model, topic, configFiles, state.repo, queue);
      })
    );

    for (const files of batchResults) {
      for (const f of files) {
        if (!existingMap.has(f.path)) {
          existingMap.set(f.path, f);
          generatedCards.push(f);
        }
      }
    }

    onCheckpoint?.({ generatedCards });
  }

  return { generatedCards, progress: 65, currentStep: "Knowledge modules generated" };
}

// ─── Node: Deep Article Writer ──────────────────────────────────────────────────

async function writeArticles(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { aiClient, model, catalogs, configFiles, queue, onProgress, onCheckpoint } = state;

  const existingMap = new Map<string, GeneratedFile>();
  if (state.generatedArticles) {
    for (const art of state.generatedArticles) {
      if (art?.path && art?.content) {
        existingMap.set(art.path, art);
      }
    }
  }

  const generatedArticles: GeneratedFile[] = Array.from(existingMap.values());
  const articles = catalogs;

  onProgress?.(
    `Writing technical documentation articles (${existingMap.size > 0 ? `${existingMap.size}/${articles.length} cached` : "starting"})...`,
    70
  );

  const batchSize = Math.max(queue.active <= 0 ? 4 : 2, 2);
  for (let batchStart = 0; batchStart < articles.length; batchStart += batchSize) {
    const batch = articles.slice(batchStart, batchStart + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (catalog, batchIdx) => {
        const i = batchStart + batchIdx;
        const rawName = catalog.name.trim();
        const articlePath = rawName.endsWith(".md") ? `en/content/${rawName}` : `en/content/${rawName}.md`;

        if (existingMap.has(articlePath)) {
          const pct = 70 + Math.round((i / articles.length) * 20);
          onProgress?.(`[Cached] Article ${i + 1}/${articles.length}: ${catalog.name}`, pct);
          return existingMap.get(articlePath)!;
        }

        // Gather relevant source context snippets
        const contextSnippets = Object.entries(configFiles)
          .slice(0, 8)
          .map(([path, content]) => `### File: ${path}\n\`\`\`\n${content.slice(0, 1500)}\n\`\`\``)
          .join("\n\n");

        const articlePrompt = `You are a principal technical author writing an exhaustive documentation sub-article titled "${catalog.name}".

## Topic Instructions:
${catalog.prompt}

## Source Context & Config Samples:
${contextSnippets}

## Mandatory Content & Formatting Requirements:
1. Start with a <cite> block listing referenced code files:
<cite>
**Referenced Files in This Document**
- [file_name](file://path/to/file)
</cite>

2. Table of Contents with anchor links.
3. Include at least TWO Mermaid diagrams (sequence diagrams \`mermaid sequenceDiagram\`, entity diagrams \`mermaid classDiagram\` or \`mermaid graph TB\`).
4. Include concrete code contracts, type interfaces, API request/response payloads, and configuration options.
5. Detail architectural design patterns, edge case handling, error types, and scaling considerations.
6. Include step-by-step processing pipelines and command-line execution examples.
7. End each major section with **Section sources** listing file paths.

Write an exhaustive, high-quality, 1000+ word technical Markdown document. Return ONLY the Markdown content.`;

        const result = await queue.enqueue(async () => {
          const response = await aiClient.chat.completions.create({
            model,
            messages: [{ role: "user", content: articlePrompt }],
            temperature: 0.3,
            max_tokens: 8192,
          });
          const content = response?.choices?.[0]?.message?.content;
          if (!content) {
            return `# ${catalog.name}\n\nDocumentation content generation returned empty response.`;
          }
          return content;
        });

        const pct = 70 + Math.round((i / articles.length) * 20);
        onProgress?.(`Article ${i + 1}/${articles.length}: ${catalog.name}`, pct);

        return {
          path: articlePath,
          content: result,
        } as GeneratedFile;
      })
    );

    for (const art of batchResults) {
      if (!existingMap.has(art.path)) {
        existingMap.set(art.path, art);
        generatedArticles.push(art);
      }
    }

    onCheckpoint?.({ generatedArticles });
  }

  return { generatedArticles, progress: 90, currentStep: "Articles written" };
}

// ─── Node: Metadata & Knowledge Graph Linker ───────────────────────────────────

async function buildMetadata(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { catalogs, generatedArticles, taxonomy, generatedCards } = state;

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
    title: a.path.replace(/^en\/content\//, "").replace(/\.md$/, ""),
    description: "",
    extend: "{}",
    progress_status: "completed",
    repo_id: state.jobId,
    reference_count: 0,
    id: uuidv4(),
    gmt_create: new Date().toISOString(),
    gmt_modified: new Date().toISOString(),
  }));

  // Auto-generate knowledge_relations mapping catalog items to knowledge topics
  const knowledgeRelations = generatedArticles.slice(0, 80).map((art, idx) => ({
    id: idx + 1,
    source_id: wikiItems[idx]?.id || uuidv4(),
    target_id: wikiItems[(idx + 1) % wikiItems.length]?.id || uuidv4(),
    source_type: "WIKI_ITEM",
    target_type: "WIKI_ITEM",
    relationship_type: "PARENT_CHILD",
    extra: JSON.stringify({ path: art.path }),
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
      `    "${m.module_path || ""}":`,
      `        dir_name: ${m.dir_name || "Module"}`,
      `        title: ${m.title || "Module"}`,
      `        scope:`,
      ...(m.scope || []).map((s) => `            - ${s}`),
      `        source_files: []`,
      `        children: [${(m.children || []).join(", ")}]`,
      `        depends_on: [${(m.depends_on || []).join(", ")}]`,
      `        related_to: [${(m.related_to || []).map((r) => `{path: ${r?.path || ""}}`).join(", ")}]`,
    ]).flat(),
  ].join("\n");

  const metadata = {
    knowledge_relations: knowledgeRelations,
    wiki_catalogs: wikiCatalogs,
    wiki_items: wikiItems,
    wiki_overview: { content: `# ${state.repo}\nAuto-generated enterprise knowledge base.`, id: uuidv4(), repo_id: state.jobId },
    wiki_readme: { content: state.configFiles["README.md"] || "", id: uuidv4(), repo_id: state.jobId },
    wiki_repo: { id: state.jobId, name: state.repo, progress_status: "completed", wiki_present_status: "COMPLETED" },
  };

  const metadataFiles: GeneratedFile[] = [
    { path: "en/meta/repowiki-metadata.json", content: JSON.stringify(metadata, null, 2) },
    { path: "knowledge/en/_index.yaml", content: indexYaml },
  ];

  return {
    metadata,
    generatedCards: [...generatedCards, ...metadataFiles],
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
