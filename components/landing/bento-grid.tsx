"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Layers,
  Bot,
  Cpu,
} from "lucide-react";

export function BentoGrid() {
  return (
    <section id="bento" className="relative px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-fuji-400">
            FEATURE BENTO GRID
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-50 sm:text-5xl">
            Engineered for <span className="text-gradient-fuji">Architectural Excellence</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base text-ink-300">
            Every component in Saaya is designed to extract deep codebase understanding and feed it cleanly to human engineers and AI coding agents.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1: Multi-Agent LangGraph Pipeline (Large 2-Col) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-raised group relative overflow-hidden rounded-3xl border border-ink-800 p-8 md:col-span-2 hover:border-fuji-500/50 hover:shadow-glow"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuji-500/10 text-fuji-400 border border-fuji-500/20">
                <Brain className="h-6 w-6" />
              </div>
              <span className="font-mono text-xs text-ink-400">01 // PIPELINE</span>
            </div>

            <div className="mt-6">
              <h3 className="font-display text-2xl font-bold text-ink-50">
                LangGraph Multi-Agent Pipeline
              </h3>
              <p className="mt-2 text-sm text-ink-300 leading-relaxed max-w-xl">
                Stateful execution graph orchestrating specialized AI nodes: <code className="text-fuji-300">planTaxonomy</code> $\rightarrow$ <code className="text-tsuki-300">generateCatalogs</code> $\rightarrow$ <code className="text-sakura-300">generateModuleCards</code> $\rightarrow$ <code className="text-matcha-400">writeArticles</code>.
              </p>
            </div>

            {/* Interactive Visual Element */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
              <div className="rounded-xl border border-ink-800 bg-ink-950/80 p-3 text-center transition-transform group-hover:scale-105">
                <p className="text-ink-400 text-[10px]">PASS 1</p>
                <p className="font-semibold text-fuji-300 mt-1">Taxonomy</p>
              </div>
              <div className="rounded-xl border border-ink-800 bg-ink-950/80 p-3 text-center transition-transform group-hover:scale-105">
                <p className="text-ink-400 text-[10px]">PASS 2</p>
                <p className="font-semibold text-tsuki-300 mt-1">Catalogs</p>
              </div>
              <div className="rounded-xl border border-ink-800 bg-ink-950/80 p-3 text-center transition-transform group-hover:scale-105">
                <p className="text-ink-400 text-[10px]">PASS 3</p>
                <p className="font-semibold text-sakura-300 mt-1">Tech Suites</p>
              </div>
              <div className="rounded-xl border border-ink-800 bg-ink-950/80 p-3 text-center transition-transform group-hover:scale-105">
                <p className="text-ink-400 text-[10px]">PASS 4</p>
                <p className="font-semibold text-matcha-400 mt-1">Graph Link</p>
              </div>
            </div>
          </motion.div>

          {/* Card 2: AI Agent Guidance (CLAUDE.md & AGENTS.md) (1-Col) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-raised group relative overflow-hidden rounded-3xl border border-ink-800 p-8 hover:border-sakura-500/50 hover:shadow-glow-sakura"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sakura-500/10 text-sakura-400 border border-sakura-500/20">
                <Bot className="h-6 w-6" />
              </div>
              <span className="font-mono text-xs text-ink-400">02 // AGENT READY</span>
            </div>

            <div className="mt-6">
              <h3 className="font-display text-2xl font-bold text-ink-50">
                CLAUDE.md Auto-Discovery
              </h3>
              <p className="mt-2 text-sm text-ink-300 leading-relaxed">
                Includes root <code className="text-sakura-400">CLAUDE.md</code> and <code className="text-tsuki-300">AGENTS.md</code> guidelines. Claude Code, Antigravity, and Cursor auto-read repowiki maps upon load.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-ink-800 bg-ink-950/90 p-3 font-mono text-[11px] text-sakura-300">
              Zero-hallucination agent prompt loading
            </div>
          </motion.div>

          {/* Card 3: Dual Knowledge Architecture (1-Col) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-raised group relative overflow-hidden rounded-3xl border border-ink-800 p-8 hover:border-tsuki-500/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tsuki-500/10 text-tsuki-400 border border-tsuki-500/20">
                <Layers className="h-6 w-6" />
              </div>
              <span className="font-mono text-xs text-ink-400">03 // DUAL DOCK</span>
            </div>

            <div className="mt-6">
              <h3 className="font-display text-2xl font-bold text-ink-50">
                Dual Knowledge Structure
              </h3>
              <p className="mt-2 text-sm text-ink-300 leading-relaxed">
                Human-readable sub-documents with Mermaid sequence diagrams + machine-parseable 6-file tech cards (<code className="text-tsuki-300">_module.yaml</code>).
              </p>
            </div>
          </motion.div>

          {/* Card 4: Tech Stack Auto Extractor (2-Col) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-raised group relative overflow-hidden rounded-3xl border border-ink-800 p-8 md:col-span-2 hover:border-matcha-500/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-matcha-500/10 text-matcha-400 border border-matcha-500/20">
                <Cpu className="h-6 w-6" />
              </div>
              <span className="font-mono text-xs text-ink-400">04 // TECH EXTRACTOR</span>
            </div>

            <div className="mt-6">
              <h3 className="font-display text-2xl font-bold text-ink-50">
                Tech-Stack Auto-Discovery (20+ Modules)
              </h3>
              <p className="mt-2 text-sm text-ink-300 leading-relaxed max-w-xl">
                Scans code imports and dependencies to identify databases, ORMs, queues, auth, and AI models. Builds 6-file documentation suites for each.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 font-mono text-xs">
              {["PostgreSQL (Neon)", "Redis (Upstash)", "Better Auth", "BullMQ Queues", "Pusher Realtime", "Voyage Embeddings", "Turborepo", "NestJS Filters"].map((t) => (
                <span key={t} className="rounded-lg border border-ink-700 bg-ink-950/80 px-3 py-1 text-ink-200">
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
