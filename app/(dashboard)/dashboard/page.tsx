"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  GitBranch,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Search,
  ExternalLink,
  Plus,
} from "lucide-react";
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
  PAUSED: { color: "text-yellow-400", icon: Pause },
  FAILED: { color: "text-red-400", icon: XCircle },
};

type FilterTab = "ALL" | "ACTIVE" | "COMPLETED" | "PAUSED" | "FAILED";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<SaayaJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  useEffect(() => {
    fetchJobs();

    const hasActiveJob = jobs.some(
      (j) => j.status !== "COMPLETED" && j.status !== "FAILED" && j.status !== "PAUSED"
    );

    if (hasActiveJob) {
      const timer = setInterval(() => {
        fetchJobs();
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [fetchJobs, jobs]);

  // Handle Pause / Resume Job
  const handleJobAction = async (jobId: string, action: "pause" | "resume" | "cancel") => {
    setActionLoading(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchJobs();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Delete Job
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job history?")) return;
    setActionLoading(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.$id !== jobId));
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  // Filtering
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.repo_name.toLowerCase().includes(search.toLowerCase()) ||
      job.current_step.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === "ACTIVE") {
      return (
        job.status !== "COMPLETED" &&
        job.status !== "FAILED" &&
        job.status !== "PAUSED"
      );
    }
    if (activeFilter === "COMPLETED") return job.status === "COMPLETED";
    if (activeFilter === "PAUSED") return job.status === "PAUSED";
    if (activeFilter === "FAILED") return job.status === "FAILED";

    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-50">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-400">
            Manage and monitor your Saaya repository knowledge jobs
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
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuji-600 via-fuji-500 to-sakura-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span>New Saaya</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-ink-800 bg-ink-900/60 p-1.5">
          {(["ALL", "ACTIVE", "COMPLETED", "PAUSED", "FAILED"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeFilter === tab
                  ? "bg-fuji-600 text-white shadow"
                  : "text-ink-400 hover:text-ink-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repository..."
            className="w-full rounded-xl border border-ink-700 bg-ink-850 py-2.5 pl-10 pr-4 text-xs text-ink-50 placeholder-ink-500 outline-none focus:border-fuji-500"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-fuji-400" />
        </div>
      )}

      {/* Jobs List */}
      {!loading && filteredJobs.length > 0 && (
        <div className="space-y-4">
          {filteredJobs.map((job, i) => {
            const config = statusConfig[job.status] || statusConfig.PENDING;
            const StatusIcon = config.icon;
            const isActive =
              job.status !== "COMPLETED" &&
              job.status !== "FAILED" &&
              job.status !== "PAUSED";

            return (
              <motion.div
                key={job.$id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <div className="group relative overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/60 p-6 transition-all duration-200 hover:border-ink-600 hover:bg-ink-850/80 shadow-elevated">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <Link href={`/jobs/${job.$id}`} className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-800 border border-ink-700">
                          <GitBranch className="h-5 w-5 text-fuji-400" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-ink-50 hover:text-fuji-300 transition-colors">
                            {job.repo_name}
                          </h3>
                          <p className="text-xs text-ink-400 mt-0.5">{job.current_step}</p>
                        </div>
                      </div>
                    </Link>

                    {/* Status Badge & Actions */}
                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className={`flex items-center gap-2 font-mono text-xs font-semibold ${config.color}`}>
                        <StatusIcon className={`h-4 w-4 ${isActive ? "animate-spin" : ""}`} />
                        <span>{job.status}</span>
                      </div>

                      {/* Job Controls */}
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <button
                            onClick={() => handleJobAction(job.$id, "pause")}
                            disabled={actionLoading === job.$id}
                            title="Pause Job"
                            className="flex items-center gap-1 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1.5 text-xs text-yellow-400 hover:bg-yellow-500/20 transition-all"
                          >
                            <Pause className="h-3.5 w-3.5" />
                            <span>Pause</span>
                          </button>
                        )}

                        {job.status === "PAUSED" && (
                          <button
                            onClick={() => handleJobAction(job.$id, "resume")}
                            disabled={actionLoading === job.$id}
                            title="Resume Job"
                            className="flex items-center gap-1 rounded-lg border border-matcha-500/30 bg-matcha-500/10 px-2.5 py-1.5 text-xs text-matcha-400 hover:bg-matcha-500/20 transition-all"
                          >
                            <Play className="h-3.5 w-3.5" />
                            <span>Resume</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteJob(job.$id)}
                          disabled={actionLoading === job.$id}
                          title="Delete Job"
                          className="flex items-center justify-center rounded-lg border border-ink-800 bg-ink-850 p-2 text-ink-400 hover:border-red-500/40 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <Link href={`/jobs/${job.$id}`} className="block mt-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress_percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-fuji-500 via-sakura-500 to-matcha-400"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-ink-400">
                      <span>{job.progress_percentage}% complete</span>
                      <span>{(job.tokens_used || 0).toLocaleString()} tokens used</span>
                    </div>
                  </Link>

                  {job.pull_request_url && (
                    <div className="mt-3 flex items-center justify-between border-t border-ink-800/80 pt-3 text-xs">
                      <span className="flex items-center gap-1.5 text-matcha-400 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        PR Ready
                      </span>
                      <a
                        href={job.pull_request_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-fuji-300 hover:underline"
                      >
                        <span>View PR</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredJobs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-700 py-20">
          <GitBranch className="mb-4 h-12 w-12 text-ink-600" />
          <h3 className="text-lg font-medium text-ink-300">No jobs found</h3>
          <p className="mt-1 text-sm text-ink-500">
            Generate your first Saaya to get started
          </p>
        </div>
      )}
    </div>
  );
}
