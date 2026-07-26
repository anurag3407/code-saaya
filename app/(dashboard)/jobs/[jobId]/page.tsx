"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

import type { JobStatus } from "@/types/saaya";

const pipelineSteps = [
  { id: "SCANNING", label: "Scanning Repository", icon: GitBranch, description: "Fetching file tree & config files" },
  { id: "PLANNING", label: "Planning Taxonomy", icon: Brain, description: "Generating _index.yaml & catalog graph" },
  { id: "GENERATING_CARDS", label: "Generating Module Cards", icon: FileText, description: "Creating 6-file knowledge cards per module" },
  { id: "WRITING_ARTICLES", label: "Writing Articles", icon: PenTool, description: "Synthesizing cited Markdown with diagrams" },
  { id: "CREATING_PR", label: "Creating Pull Request", icon: GitBranch, description: "Committing .saaya/repowiki/ via Octokit" },
];

interface JobData {
  status: JobStatus;
  progress_percentage: number;
  current_step: string;
  pull_request_url?: string;
  repo_name?: string;
  error_message?: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
    // Poll every 3s while job is active
    const interval = setInterval(() => {
      fetchJob();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchJob]);

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

      {/* Error State */}
      {isFailed && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
          <XCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{job?.error_message || "Generation failed. Please try again."}</span>
        </div>
      )}
        </>
      )}
    </div>
  );
}
