import fs from "fs";
import path from "path";
import type { JobStatus, ModuleNode, CatalogNode, GeneratedFile, RepoFileInfo } from "@/types/saaya";

export interface LogEntry {
  ts: number;
  level: "info" | "success" | "warn" | "error";
  message: string;
}

export interface JobCheckpoint {
  fileTree?: RepoFileInfo[];
  configFiles?: Record<string, string>;
  taxonomy?: ModuleNode[];
  catalogs?: CatalogNode[];
  generatedCards?: GeneratedFile[];
  generatedArticles?: GeneratedFile[];
}

export interface JobRecord {
  $id: string;
  user_id: string;
  repo_url: string;
  repo_name: string;
  branch_name?: string;
  status: JobStatus;
  progress_percentage: number;
  current_step: string;
  tokens_used?: number;
  pull_request_url?: string;
  error_message?: string;
  created_at: string;
  logs?: LogEntry[];
  checkpoint?: JobCheckpoint;
}

const STORAGE_FILE = path.join(process.cwd(), ".saaya-jobs-cache.json");

const globalForJobs = globalThis as unknown as {
  __saaya_jobs_map__?: Map<string, JobRecord>;
};

function loadJobsFromDisk(): Map<string, JobRecord> {
  const map = new Map<string, JobRecord>();
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, "utf-8");
      const list: JobRecord[] = JSON.parse(data);
      for (const job of list) {
        map.set(job.$id, job);
      }
    }
  } catch {
    // ignore
  }
  return map;
}

function saveJobsToDisk(map: Map<string, JobRecord>): void {
  try {
    const list = Array.from(map.values());
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

if (!globalForJobs.__saaya_jobs_map__) {
  globalForJobs.__saaya_jobs_map__ = loadJobsFromDisk();
}
const jobsMap = globalForJobs.__saaya_jobs_map__!;

const MAX_LOGS = 300; // Keep last 300 log entries per job

export function setInMemoryJob(job: JobRecord): void {
  jobsMap.set(job.$id, { ...job, logs: job.logs || [] });
  saveJobsToDisk(jobsMap);
}

export function updateInMemoryJob(
  jobId: string,
  updates: Partial<JobRecord>
): JobRecord | undefined {
  const existing = jobsMap.get(jobId);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  jobsMap.set(jobId, updated);
  saveJobsToDisk(jobsMap);
  return updated;
}

export function deleteInMemoryJob(jobId: string): boolean {
  const deleted = jobsMap.delete(jobId);
  if (deleted) {
    saveJobsToDisk(jobsMap);
  }
  return deleted;
}

export function pushJobLog(
  jobId: string,
  level: LogEntry["level"],
  message: string
): void {
  const job = jobsMap.get(jobId);
  if (!job) return;
  if (!job.logs) job.logs = [];
  job.logs.push({ ts: Date.now(), level, message });
  if (job.logs.length > MAX_LOGS) {
    job.logs = job.logs.slice(-MAX_LOGS);
  }
  saveJobsToDisk(jobsMap);
}

export function getInMemoryJob(jobId: string): JobRecord | undefined {
  return jobsMap.get(jobId);
}

export function listInMemoryUserJobs(userId: string): JobRecord[] {
  return Array.from(jobsMap.values())
    .filter((j) => j.user_id === userId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}
