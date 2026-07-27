"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  GitBranch,
  FileText,
  Brain,
  PenTool,
  ExternalLink,
  XCircle,
  Terminal,
  RotateCcw,
  Plus,
  Play,
  Pause,
  Trash2,
  Download,
  Search,
  Clock,
  Zap,
  Filter,
} from "lucide-react";

import type { JobStatus } from "@/types/saaya";

const pipelineSteps = [
  { id: "SCANNING", label: "Scanning Repository", icon: GitBranch, description: "Fetching file tree, schemas & config files" },
  { id: "PLANNING", label: "Planning Multi-Pass Taxonomy", icon: Brain, description: "Partitioning domain folders & _index.yaml" },
  { id: "GENERATING_CARDS", label: "Generating Tech Module Suites", icon: FileText, description: "Extracting 20+ tech topics & 6-file module cards" },
  { id: "WRITING_ARTICLES", label: "Writing Deep Articles", icon: PenTool, description: "Synthesizing Markdown with Mermaid diagrams & file citations" },
  { id: "CREATING_PR", label: "Creating GitHub PR & Guidelines", icon: GitBranch, description: "Committing repowiki/, CLAUDE.md & AGENTS.md via Octokit" },
];

interface LogEntry {
  ts: number;
  level: "info" | "success" | "warn" | "error";
  message: string;
}

interface JobData {
  $id?: string;
  status: JobStatus;
  progress_percentage: number;
  current_step: string;
  pull_request_url?: string;
  repo_name?: string;
  repo_url?: string;
  error_message?: string;
  tokens_used?: number;
  created_at?: string;
  logs?: LogEntry[];
}

type LogFilter = "all" | "info" | "success" | "warn" | "error";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Terminal Log Filters & Search
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState<LogFilter>("all");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data);
        if (data.status === "COMPLETED" || data.status === "FAILED" || data.status === "PAUSED") {
          stopPolling();
        }
      } else if (res.status === 404) {
        setNotFound(true);
        stopPolling();
      }
    } catch {
      // network error — keep trying
    } finally {
      setLoading(false);
    }
  }, [jobId, stopPolling]);

  useEffect(() => {
    fetchJob();
    intervalRef.current = setInterval(() => {
      fetchJob();
    }, 2000);
    return () => stopPolling();
  }, [fetchJob, stopPolling]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [job?.logs?.length]);

  // Handle Pause / Resume / Cancel
  const handleJobAction = async (action: "pause" | "resume" | "cancel") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchJob();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Job
  const handleDeleteJob = async () => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch {
      setActionLoading(false);
    }
  };

  // Download Logs as Text File
  const handleDownloadLogs = () => {
    if (!job?.logs) return;
    const logText = job.logs
      .map(
        (l) =>
          `[${new Date(l.ts).toISOString()}] [${l.level.toUpperCase()}] ${l.message}`
      )
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saaya-job-${jobId}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentStatus = job?.status || ("PENDING" as JobStatus);
  const progress = job?.progress_percentage || 0;
  const currentIndex = pipelineSteps.findIndex((s) => s.id === currentStatus);
  const isFailed = currentStatus === "FAILED";
  const isCompleted = currentStatus === "COMPLETED";
  const isPaused = currentStatus === "PAUSED";

  // Filtered Logs
  const filteredLogs = (job?.logs || []).filter((log) => {
    const matchesFilter = logFilter === "all" || log.level === logFilter;
    const matchesSearch = log.message
      .toLowerCase()
      .includes(logSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-50">Generation Progress</h1>
          <p className="mt-1 font-mono text-sm text-ink-400">
            {job?.repo_name || `Job: ${jobId}`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {!isCompleted && !isFailed && !isPaused && (
            <button
              onClick={() => handleJobAction("pause")}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 text-xs font-semibold text-yellow-400 hover:bg-yellow-500/20 transition-all"
            >
              <Pause className="h-4 w-4" />
              Pause
            </button>
          )}

          {isPaused && (
            <button
              onClick={() => handleJobAction("resume")}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl border border-matcha-500/30 bg-matcha-500/10 px-4 py-2.5 text-xs font-semibold text-matcha-400 hover:bg-matcha-500/20 transition-all"
            >
              <Play className="h-4 w-4" />
              Resume
            </button>
          )}

          <button
            onClick={handleDeleteJob}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-xl border border-ink-800 bg-ink-900 px-4 py-2.5 text-xs font-semibold text-ink-300 hover:border-red-500/40 hover:text-red-400 transition-all"
          >
            <Trash2 className="h-4 w-4" />
            Delete Job
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-fuji-400" />
        </div>
      ) : notFound ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <XCircle className="h-12 w-12 text-ink-600" />
          <p className="text-lg font-medium text-ink-300">Job not found</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl bg-fuji-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <>
          {/* Progress Overview & Metrics */}
          <div className="rounded-2xl border border-ink-800 bg-ink-900/50 p-8 shadow-elevated">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink-200">Overall Progress</span>
                <span className="rounded-full bg-fuji-500/10 px-2.5 py-0.5 font-mono text-xs text-fuji-300">
                  {currentStatus}
                </span>
              </div>
              <span className="font-display text-base font-bold text-fuji-300">{progress}%</span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-ink-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-fuji-500 via-sakura-500 to-matcha-400"
              />
            </div>

            {/* Metrics Row */}
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-ink-800/80 pt-4 sm:grid-cols-3 font-mono text-xs">
              <div>
                <span className="text-ink-400 block">Tokens Consumed</span>
                <span className="font-semibold text-ink-100 font-sans mt-0.5 block">
                  {(job?.tokens_used || 0).toLocaleString()} tokens
                </span>
              </div>
              <div>
                <span className="text-ink-400 block">Status</span>
                <span className="font-semibold text-matcha-400 font-sans mt-0.5 block">
                  {isPaused ? "Paused" : isCompleted ? "Completed" : "Running"}
                </span>
              </div>
              <div>
                <span className="text-ink-400 block">Repository Target</span>
                <span className="font-semibold text-fuji-300 truncate font-sans mt-0.5 block">
                  {job?.repo_name || "GitHub Repo"}
                </span>
              </div>
            </div>
          </div>

          {/* Pipeline Steps List */}
          <div className="space-y-3">
            {pipelineSteps.map((step, i) => {
              const isComplete = i < currentIndex || isCompleted;
              const isCurrent = i === currentIndex && !isCompleted && !isFailed && !isPaused;
              const isPending = i > currentIndex && !isCompleted;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex items-center gap-4 rounded-2xl border p-5 transition-all ${
                    isCurrent
                      ? "border-fuji-500/50 bg-fuji-500/10 shadow-glow"
                      : isComplete
                        ? "border-matcha-500/20 bg-matcha-500/5"
                        : "border-ink-800/80 bg-ink-900/30"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isCurrent
                        ? "bg-fuji-500/20"
                        : isComplete
                          ? "bg-matcha-500/15"
                          : "bg-ink-800"
                    }`}
                  >
                    {isCurrent ? (
                      <Loader2 className="h-5 w-5 animate-spin text-fuji-400" />
                    ) : isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-matcha-400" />
                    ) : (
                      <step.icon className="h-5 w-5 text-ink-500" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3
                      className={`font-display font-semibold text-sm ${
                        isCurrent
                          ? "text-fuji-300"
                          : isComplete
                            ? "text-matcha-400"
                            : "text-ink-500"
                      }`}
                    >
                      {step.label}
                    </h3>
                    <p className="text-xs text-ink-400 mt-0.5">{step.description}</p>
                  </div>

                  {isPending && <span className="font-mono text-[11px] text-ink-600">Pending</span>}
                </motion.div>
              );
            })}
          </div>

          {/* PR Link (when complete) */}
          {isCompleted && job?.pull_request_url && (
            <motion.a
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              href={job.pull_request_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 rounded-2xl border border-matcha-500/40 bg-matcha-500/10 p-6 text-matcha-400 transition-all hover:bg-matcha-500/20 shadow-glow"
            >
              <ExternalLink className="h-5 w-5" />
              <span className="font-semibold text-base">View Generated Pull Request on GitHub</span>
            </motion.a>
          )}

          {/* Detailed Live Terminal Logs */}
          <div className="rounded-2xl border border-ink-800 bg-ink-950 overflow-hidden shadow-elevated">
            {/* Terminal Top Bar */}
            <div className="flex flex-col gap-3 border-b border-ink-800 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-fuji-400" />
                <span className="font-mono text-xs font-bold text-ink-100">Live Execution Terminal</span>
                <span className="text-xs text-ink-500 font-mono">({filteredLogs.length} logs)</span>
              </div>

              {/* Log Search & Filter Controls */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search logs..."
                    className="w-36 rounded-lg border border-ink-800 bg-ink-900 py-1 pl-8 pr-2 font-mono text-[11px] text-ink-100 placeholder-ink-500 outline-none focus:border-fuji-500"
                  />
                </div>

                <div className="flex items-center rounded-lg border border-ink-800 bg-ink-900 p-0.5 font-mono text-[10px]">
                  {(["all", "info", "success", "warn", "error"] as LogFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLogFilter(filter)}
                      className={`rounded px-2 py-0.5 uppercase transition-all ${
                        logFilter === filter ? "bg-fuji-600 text-white font-bold" : "text-ink-400 hover:text-ink-100"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleDownloadLogs}
                  title="Download Logs as Text File"
                  className="flex items-center gap-1 rounded-lg border border-ink-800 bg-ink-900 px-2.5 py-1 text-xs text-ink-300 hover:border-ink-700 hover:text-ink-50 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Terminal Stream View */}
            <div className="max-h-[360px] overflow-y-auto p-4 font-mono text-xs leading-relaxed">
              {filteredLogs.length === 0 ? (
                <p className="text-ink-500 italic py-4 text-center">No logs matching filter</p>
              ) : (
                filteredLogs.map((log, i) => (
                  <div key={i} className="flex gap-2 py-0.5 border-b border-ink-900/40">
                    <span className="shrink-0 text-ink-600">
                      {new Date(log.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span
                      className={
                        log.level === "success"
                          ? "text-matcha-400 font-semibold"
                          : log.level === "error"
                            ? "text-red-400 font-semibold"
                            : log.level === "warn"
                              ? "text-yellow-400"
                              : "text-ink-300"
                      }
                    >
                      {log.level === "success" ? "✓ " : log.level === "error" ? "✗ " : "  "}
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
