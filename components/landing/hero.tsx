"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Terminal,
  GitPullRequest,
  Bot,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";

export function Hero() {
  const [activeTab, setActiveTab] = useState<"cli" | "pr" | "agent">("cli");
  const [copied, setCopied] = useState(false);

  const commandText = "npx saaya generate https://github.com/owner/repository";

  const handleCopy = () => {
    navigator.clipboard.writeText(commandText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden px-6 pt-12 pb-20 md:px-12 md:pt-20 md:pb-32">
      {/* ─── Ambient Glow & Grid Lines ─── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-fuji-600/15 blur-[140px]" />
        <div className="absolute top-1/3 right-10 h-[400px] w-[400px] rounded-full bg-sakura-500/10 blur-[120px]" />
        <div className="absolute top-10 left-10 h-[300px] w-[300px] rounded-full bg-tsuki-500/10 blur-[100px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1e2a_1px,transparent_1px),linear-gradient(to_bottom,#1e1e2a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* ─── Hero Badge & Title ─── */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-fuji-500/30 bg-fuji-500/10 px-4 py-1.5 text-xs font-medium text-fuji-300 backdrop-blur-md shadow-glow"
          >
            <span className="flex h-2 w-2 rounded-full bg-matcha-400 animate-pulse" />
            <span className="font-mono tracking-widest uppercase text-[11px]">
              NEXT-GEN REPOSITORY KNOWLEDGE SUITE
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 max-w-5xl font-display text-4xl font-extrabold tracking-tight text-ink-50 sm:text-6xl lg:text-7xl"
          >
            Turn Any Codebase Into <br />
            <span className="text-gradient-fuji">Pre-Indexed Knowledge</span> for AI Agents.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-3xl text-base text-ink-300 sm:text-xl leading-relaxed font-sans"
          >
            LangGraph multi-agent pipeline extracts deep database schemas, API contracts, and 6-file technology modules. Automatically delivers <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-fuji-300">repowiki/</code>, <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-sakura-400">CLAUDE.md</code>, and <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-tsuki-300">AGENTS.md</code> straight to your GitHub PR.
          </motion.p>

          {/* ─── Hero CTAs ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
          >
            <Link
              href="/dashboard/new"
              className="group relative inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-fuji-600 via-fuji-500 to-sakura-500 px-8 py-4 text-base font-bold text-white shadow-glow transition-all duration-300 hover:scale-105 hover:shadow-glow-sakura"
            >
              <Sparkles className="h-5 w-5" />
              <span>Generate Repowiki Free</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <button
              onClick={handleCopy}
              className="glass flex items-center gap-3 rounded-2xl border border-ink-700 px-6 py-4 font-mono text-xs text-ink-200 transition-all hover:border-fuji-500/50 hover:bg-ink-800/60"
            >
              <Terminal className="h-4 w-4 text-fuji-400" />
              <span className="truncate max-w-[280px] sm:max-w-none">{commandText}</span>
              {copied ? (
                <Check className="h-4 w-4 text-matcha-400" />
              ) : (
                <Copy className="h-4 w-4 text-ink-400 hover:text-ink-50" />
              )}
            </button>
          </motion.div>
        </div>

        {/* ─── Interactive 3-Tab Preview Widget ─── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="glass-raised mt-14 overflow-hidden rounded-2xl border border-ink-700/80 shadow-elevated"
        >
          {/* Tab Header Bar */}
          <div className="flex items-center justify-between border-b border-ink-800/80 bg-ink-950/80 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-2 font-mono text-xs text-ink-400">
                saaya-v2.0 // interactive-preview
              </span>
            </div>

            {/* Tab Switches */}
            <div className="flex items-center gap-1 rounded-xl bg-ink-900/90 p-1 border border-ink-800">
              <button
                onClick={() => setActiveTab("cli")}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "cli"
                    ? "bg-fuji-600 text-white shadow"
                    : "text-ink-400 hover:text-ink-100"
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>1. Scan Execution</span>
              </button>

              <button
                onClick={() => setActiveTab("pr")}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "pr"
                    ? "bg-fuji-600 text-white shadow"
                    : "text-ink-400 hover:text-ink-100"
                }`}
              >
                <GitPullRequest className="h-3.5 w-3.5 text-sakura-400" />
                <span>2. GitHub PR View</span>
              </button>

              <button
                onClick={() => setActiveTab("agent")}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "agent"
                    ? "bg-fuji-600 text-white shadow"
                    : "text-ink-400 hover:text-ink-100"
                }`}
              >
                <Bot className="h-3.5 w-3.5 text-tsuki-400" />
                <span>3. CLAUDE.md Agent View</span>
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="min-h-[380px] bg-ink-950/90 p-6 font-mono text-xs sm:p-8">
            <AnimatePresence mode="wait">
              {activeTab === "cli" && (
                <motion.div
                  key="cli"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3 leading-relaxed"
                >
                  <p className="text-ink-400">$ saaya generate --repo=https://github.com/owner/repository</p>
                  <p className="text-fuji-300">➜ [1/5] Universal Smart Code Scanner: Discovered 240 files & sampled 18 schemas/controllers</p>
                  <p className="text-tsuki-300">➜ [2/5] Tech-Stack Extractor: Identified 18 topics (PostgreSQL, Redis, Better Auth, BullMQ, Pusher)</p>
                  <p className="text-sakura-300">➜ [3/5] Multi-Pass Domain Planner: Planned 72 nested sub-articles across 8 functional domains</p>
                  <p className="text-matcha-400">➜ [4/5] Deep Article Writer: Generated Mermaid sequence diagrams & code contract citations</p>
                  <p className="text-fuji-400">➜ [5/5] Knowledge Graph Linker: Connected 82 relations in repowiki-metadata.json</p>
                  <div className="mt-4 rounded-xl border border-matcha-500/30 bg-matcha-500/10 p-4 text-matcha-300">
                    <p className="font-bold">✓ SUCCESS: Pull Request created on owner/repository!</p>
                    <p className="text-ink-300 mt-1">PR Link: https://github.com/owner/repository/pull/42</p>
                  </div>
                </motion.div>
              )}

              {activeTab === "pr" && (
                <motion.div
                  key="pr"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-900/60 p-4">
                    <div className="flex items-center gap-3">
                      <GitPullRequest className="h-5 w-5 text-matcha-400" />
                      <div>
                        <p className="font-sans font-bold text-ink-50">Add Auto-Generated Saaya RepoWiki Knowledge Base & Agent Guidelines</p>
                        <p className="text-ink-400 text-[11px]">#42 opened by @saaya-bot · 368 files changed (+42,661 lines)</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-matcha-500/20 px-3 py-1 text-[11px] font-semibold text-matcha-400">Open</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
                      <p className="font-sans font-semibold text-fuji-300">.saaya/repowiki/en/content/</p>
                      <p className="text-ink-400 text-[11px] mt-1">111 nested sub-documents (Database Schema, Backend API, Workers, Frontend)</p>
                    </div>
                    <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
                      <p className="font-sans font-semibold text-sakura-300">.saaya/repowiki/knowledge/en/</p>
                      <p className="text-ink-400 text-[11px] mt-1">256 files across 21 technology 6-file module suites</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "agent" && (
                <motion.div
                  key="agent"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className="rounded-xl border border-tsuki-500/30 bg-tsuki-500/10 p-4 text-tsuki-200">
                    <p className="font-sans font-bold text-white flex items-center gap-2">
                      <Bot className="h-4 w-4 text-tsuki-400" /> CLAUDE.md & AGENTS.md Guidelines
                    </p>
                    <p className="mt-1 text-[11px] text-ink-300">Auto-detected by Claude Code, Antigravity, Cursor, and Aider upon repository load.</p>
                  </div>

                  <pre className="rounded-xl border border-ink-800 bg-ink-900/80 p-4 text-ink-200 text-[11px] overflow-x-auto leading-relaxed">
{`# AI Agent Guidance & Architectural Map

This repository includes a pre-indexed knowledge base under repowiki/:

- Architecture Overview: repowiki/en/content/Architecture Overview/System Architecture.md
- Database Schemas: repowiki/en/content/Database Schema/Database Schema.md
- Backend API Services: repowiki/en/content/Backend API/Backend API.md
- Background Workers: repowiki/en/content/Background Workers/Worker Architecture.md
- Tech Coding Rules: repowiki/knowledge/en/PostgreSQL/coding_conventions.md`}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
