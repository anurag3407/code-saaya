import type { JobStatus } from "@/types/saaya";

export interface LogEntry {
  ts: number;
  level: "info" | "success" | "warn" | "error";
  message: string;
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
  pull_request_url?: string;
  error_message?: string;
  created_at: string;
  logs?: LogEntry[];
}

// Global in-memory map to store jobs across active server instances
const jobsMap = new Map<string, JobRecord>();

const MAX_LOGS = 200; // Keep last 200 log entries per job

export function setInMemoryJob(job: JobRecord): void {
  jobsMap.set(job.$id, { ...job, logs: [] });
}

export function updateInMemoryJob(jobId: string, updates: Partial<JobRecord>): JobRecord | undefined {
  const existing = jobsMap.get(jobId);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  jobsMap.set(jobId, updated);
  return updated;
}

export function pushJobLog(jobId: string, level: LogEntry["level"], message: string): void {
  const job = jobsMap.get(jobId);
  if (!job) return;
  if (!job.logs) job.logs = [];
  job.logs.push({ ts: Date.now(), level, message });
  // Trim old logs
  if (job.logs.length > MAX_LOGS) {
    job.logs = job.logs.slice(-MAX_LOGS);
  }
}

export function getInMemoryJob(jobId: string): JobRecord | undefined {
  return jobsMap.get(jobId);
}

export function listInMemoryUserJobs(userId: string): JobRecord[] {
  return Array.from(jobsMap.values())
    .filter((j) => j.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
