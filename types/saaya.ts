// ─── Saaya Job Types ───────────────────────────────────────────────────────────

export type JobStatus =
  | "PENDING"
  | "SCANNING"
  | "PLANNING"
  | "GENERATING_CARDS"
  | "WRITING_ARTICLES"
  | "CREATING_PR"
  | "COMPLETED"
  | "PAUSED"
  | "FAILED";

export interface SaayaJob {
  $id: string;
  user_id: string;
  repo_url: string;
  repo_name: string;
  branch_name?: string;
  status: JobStatus;
  progress_percentage: number;
  current_step: string;
  pull_request_url?: string;
  error_message?: string;
  tokens_used: number;
  created_at: string;
}

// ─── AI Provider Types ─────────────────────────────────────────────────────────

export type ProviderType = "OPENROUTER" | "CUSTOM_OPENAI";

export interface AIProvider {
  $id: string;
  user_id: string;
  provider_type: ProviderType;
  base_url: string;
  api_key: string;
  selected_model: string;
  is_free_tier: boolean;
  max_rpm: number;
  max_tpm: number;
  max_concurrency: number;
}

// ─── Saaya Artifact Types ──────────────────────────────────────────────────────

export interface SaayaArtifact {
  $id: string;
  job_id: string;
  file_path: string;
  content: string;
  status: "COMPLETED";
}

// ─── OpenRouter Model Types ────────────────────────────────────────────────────

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: string;
    completion: string;
    request?: string;
  };
  context_length: number;
  is_free: boolean;
}

// ─── Generation Pipeline Types ─────────────────────────────────────────────────

export interface RepoFileInfo {
  path: string;
  type: "file" | "dir";
  size?: number;
}

export interface ModuleNode {
  module_path: string;
  dir_name: string;
  title: string;
  scope: string[];
  source_files: string[];
  children: string[];
  depends_on: string[];
  related_to: { path: string }[];
}

export interface CatalogNode {
  id: string;
  name: string;
  description: string;
  prompt: string;
  dependent_files: string;
  progress_status: "pending" | "completed";
}

export interface KnowledgeRelation {
  id: number;
  source_id: string;
  target_id: string;
  source_type: "WIKI_ITEM";
  target_type: "WIKI_ITEM";
  relationship_type: "PARENT_CHILD";
  extra: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

// ─── Pipeline State (LangGraph) ────────────────────────────────────────────────

export interface PipelineState {
  jobId: string;
  repoUrl: string;
  owner: string;
  repo: string;
  githubToken: string;
  fileTree: RepoFileInfo[];
  configFiles: Record<string, string>;
  taxonomy: ModuleNode[];
  catalogs: CatalogNode[];
  generatedCards: GeneratedFile[];
  generatedArticles: GeneratedFile[];
  metadata: Record<string, unknown>;
  pullRequestUrl?: string;
  error?: string;
  progress: number;
  currentStep: string;
}
