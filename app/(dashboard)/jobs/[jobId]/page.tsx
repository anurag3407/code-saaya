"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

import type { JobStatus } from "@/types/saaya";

const pipelineSteps = [
  { id: "SCANNING", label: "Scanning Repository", icon: GitBranch, description: "Fetching file tree & config files" },
  { id: "PLANNING", label: "Planning Taxonomy", icon: Brain, description: "Generating _index.yaml & catalog graph" },
  { id: "GENERATING_CARDS", label: "Generating Module Cards", icon: FileText, description: "Creating 6-file knowledge cards per module" },
  { id: "WRITING_ARTICLES", label: "Writing Articles", icon: PenTool, description: "Synthesizing cited Markdown with diagrams" },
  { id: "CREATING_PR", label: "Creating Pull Request", icon: GitBranch, description: "Committing .saaya/repowiki/ via Octokit" },
];

interface LogEntry {
  ts: number;
  level: "info" | "success" | "warn" | "error";
  message: string;
}

interface JobData {
  status: JobStatus;
  progress_percentage: number;
  current_step: string;
  pull_request_url?: string;
  repo_name?: string;
  repo_url?: string;
  error_message?: string;
  logs?: LogEntry[];
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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
        // Stop polling on terminal states
        if (data.status === "COMPLETED" || data.status === "FAILED") {
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
    // Poll every 2s for responsive live logs
    intervalRef.current = setInterval(() => {
      fetchJob();
    }, 2000);
    return () => stopPolling();
  }, [fetchJob, stopPolling]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [job?.logs?.length]);

  const currentStatus = job?.status || ("PENDING" as JobStatus);
  const progress = job?.progress_percentage || 0;
  const currentIndex = pipelineSteps.findIndex((s) => s.id === currentStatus);
  const isFailed = currentStatus === "FAILED";
  const isCompleted = currentStatus === "COMPLETED";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">Generation Progress</h1>
        <p className="mt-1 font-mono text-sm text-ink-400">
          {job?.repo_name || `Job: ${jobId}`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-fuji-400" />
        </div>
      ) : notFound ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <XCircle className="h-12 w-12 text-ink-600" />
          <p className="text-lg font-medium text-ink-300">Job not found</p>
          <p className="text-sm text-ink-500">
            This job may have expired or does not exist.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-2 rounded-xl bg-fuji-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <>

      {/* Overall Progress */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/50 p-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-ink-200">
            Overall Progress
          </span>
          <span className="text-sm font-bold text-fuji-300">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ink-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-fuji-500 via-sakura-500 to-fuji-400"
          />
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="space-y-3">
        {pipelineSteps.map((step, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isPending = i > currentIndex;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-4 rounded-xl border p-5 transition-all ${
                isCurrent
                  ? "border-fuji-500/40 bg-fuji-500/5"
                  : isComplete
                    ? "border-matcha-500/20 bg-matcha-500/5"
                    : "border-ink-800 bg-ink-900/30"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isCurrent
                    ? "bg-fuji-500/15"
                    : isComplete
                      ? "bg-matcha-500/10"
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
                  className={`font-medium ${
                    isCurrent
                      ? "text-fuji-300"
                      : isComplete
                        ? "text-matcha-400"
                        : "text-ink-500"
                  }`}
                >
                  {step.label}
                </h3>
                <p className="text-sm text-ink-500">{step.description}</p>
              </div>
              {isPending && (
                <span className="text-xs text-ink-600">Waiting</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* PR Link (shown when complete) */}
      {isCompleted && job?.pull_request_url && (
        <motion.a
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          href={job.pull_request_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 rounded-2xl border border-matcha-500/30 bg-matcha-500/10 p-6 text-matcha-400 transition-all hover:bg-matcha-500/15"
        >
          <ExternalLink className="h-5 w-5" />
          <span className="font-medium">View Pull Request on GitHub</span>
        </motion.a>
      )}

      {/* Generate Another (completed) */}
      {isCompleted && (
        <div className="flex justify-center">
          <button
            onClick={() => router.push("/dashboard/new")}
            className="flex items-center gap-2 rounded-xl border border-ink-700 px-6 py-3 text-sm text-ink-300 transition-all hover:border-fuji-500/50 hover:text-fuji-300"
          >
            <Plus className="h-4 w-4" />
            Generate for Another Repo
          </button>
        </div>
      )}

      {/* Error State */}
      {isFailed && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
            <XCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{job?.error_message || "Generation failed. Please try again."}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                setJob(null);
                setLoading(true);
                setNotFound(false);
                try {
                  const res = await fetch("/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ repoUrl: job?.repo_url || "" }),
                  });
                  const data = await res.json();
                  if (data.jobId) {
                    window.location.href = `/jobs/${data.jobId}`;
                  }
                } catch { /* ignore */ } finally {
                  setLoading(false);
                }
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuji-600 to-fuji-500 py-3 font-medium text-white transition-all hover:brightness-110"
            >
              <RotateCcw className="h-4 w-4" />
              Retry Generation
            </button>
            <button
              onClick={() => router.push("/dashboard/new")}
              className="rounded-xl border border-ink-700 px-6 py-3 text-sm text-ink-300 transition-all hover:border-ink-500"
            >
              New Repo
            </button>
          </div>
        </div>
      )}

      {/* Live Logs Terminal */}
      {job?.logs && job.logs.length > 0 && (
        <div className="rounded-2xl border border-ink-800 bg-ink-950 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink-800 px-5 py-3">
            <Terminal className="h-4 w-4 text-fuji-400" />
            <span className="text-xs font-medium text-ink-300">Live Output</span>
            <span className="ml-auto flex items-center gap-1.5">
              {!isCompleted && !isFailed && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-matcha-400" />
              )}
              <span className="text-xs text-ink-500">{job.logs.length} lines</span>
            </span>
          </div>
          <div className="max-h-[320px] overflow-y-auto p-4 font-mono text-xs leading-relaxed">
            {job.logs.map((log, i) => (
              <div key={i} className="flex gap-2 py-0.5">
                <span className="shrink-0 text-ink-600">
                  {new Date(log.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <span
                  className={
                    log.level === "success"
                      ? "text-matcha-400"
                      : log.level === "error"
                        ? "text-red-400"
                        : log.level === "warn"
                          ? "text-yellow-400"
                          : "text-ink-300"
                  }
                >
                  {log.level === "success" ? "✓ " : log.level === "error" ? "✗ " : "  "}
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
