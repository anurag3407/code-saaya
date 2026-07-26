"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { GitBranch, Clock, CheckCircle2, XCircle, Loader2, RefreshCw, Play } from "lucide-react";
import Link from "next/link";
import type { SaayaJob, JobStatus } from "@/types/saaya";

const statusConfig: Record<JobStatus, { color: string; icon: typeof Clock }> = {
  PENDING: { color: "text-ink-400", icon: Clock },
  SCANNING: { color: "text-tsuki-400", icon: Loader2 },
  PLANNING: { color: "text-tsuki-400", icon: Loader2 },
  GENERATING_CARDS: { color: "text-fuji-400", icon: Loader2 },
  WRITING_ARTICLES: { color: "text-fuji-400", icon: Loader2 },
  CREATING_PR: { color: "text-sakura-400", icon: Loader2 },
  COMPLETED: { color: "text-matcha-400", icon: CheckCircle2 },
  FAILED: { color: "text-red-400", icon: XCircle },
};

export default function DashboardPage() {
  const [jobs, setJobs] = useState<SaayaJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll active jobs every 3s
  useEffect(() => {
    fetchJobs();

    const hasActiveJob = jobs.some(
      (j) => j.status !== "COMPLETED" && j.status !== "FAILED"
    );

    if (hasActiveJob) {
      const timer = setInterval(() => {
        fetchJobs();
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [fetchJobs, jobs]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-50">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-400">
            Monitor your Saaya generation jobs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchJobs()}
            className="flex items-center gap-2 rounded-xl border border-ink-700 px-4 py-2.5 text-sm text-ink-300 transition-all hover:border-ink-500 hover:text-ink-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <Link
            href="/dashboard/new"
            className="rounded-xl bg-gradient-to-r from-fuji-600 to-fuji-500 px-6 py-2.5 text-sm font-medium text-white shadow-glow transition-all hover:brightness-110"
          >
            + New Saaya
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-fuji-400" />
        </div>
      )}

      {/* Jobs List */}
      {!loading && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job, i) => {
            const config = statusConfig[job.status] || statusConfig.PENDING;
            const StatusIcon = config.icon;
            const isAnimating =
              job.status !== "COMPLETED" && job.status !== "FAILED";

            return (
              <motion.div
                key={job.$id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <div className="relative rounded-2xl border border-ink-800 bg-ink-900/50 p-6 transition-all duration-200 hover:border-ink-600 hover:bg-ink-850/80">
                  <Link href={`/jobs/${job.$id}`} className="block">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-800">
                          <GitBranch className="h-5 w-5 text-ink-300" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-ink-100">
                            {job.repo_name}
                          </h3>
                          <p className="text-sm text-ink-400">{job.current_step}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 ${config.color}`}>
                        <StatusIcon
                          className={`h-5 w-5 ${isAnimating ? "animate-spin" : ""}`}
                        />
                        <span className="text-sm font-medium">{job.status}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${job.progress_percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-fuji-500 to-sakura-500"
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
                        <span>{job.progress_percentage}% complete</span>
                        <span>{(job.tokens_used || 0).toLocaleString()} tokens used</span>
                      </div>
                    </div>

                    {job.pull_request_url && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-matcha-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>PR Ready</span>
                      </div>
                    )}
                  </Link>

                  {/* Continue Button for Incomplete/Failed Jobs */}
                  {job.status === "FAILED" && (
                    <div className="mt-4 flex items-center gap-3 border-t border-ink-800/80 pt-3">
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            const res = await fetch("/api/generate", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ resumeJobId: job.$id }),
                            });
                            const data = await res.json();
                            if (data.jobId) {
                              window.location.href = `/jobs/${data.jobId}`;
                            }
                          } catch {
                            // ignore
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-fuji-600/20 px-3 py-1.5 text-xs font-medium text-fuji-300 transition-all hover:bg-fuji-600/30"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Continue from step: {job.current_step}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-700 py-20">
          <GitBranch className="mb-4 h-12 w-12 text-ink-600" />
          <h3 className="text-lg font-medium text-ink-300">No jobs yet</h3>
          <p className="mt-1 text-sm text-ink-500">
            Generate your first Saaya to get started
          </p>
        </div>
      )}
    </div>
  );
}
