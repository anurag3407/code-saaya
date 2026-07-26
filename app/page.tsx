"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  GitBranch,
  FileText,
  Brain,
  Layers,
  Zap,
} from "lucide-react";
import type { Variants } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const features = [
  {
    icon: Brain,
    title: "Multi-Agent AI Pipeline",
    description:
      "LangGraph-orchestrated agents scan, plan, and generate documentation with rate-limit awareness.",
  },
  {
    icon: Layers,
    title: "Dual Knowledge Architecture",
    description:
      "Human-readable articles with Mermaid diagrams + machine-parseable 6-file module knowledge cards.",
  },
  {
    icon: GitBranch,
    title: "Automated Pull Requests",
    description:
      "Octokit-powered branch creation, git tree commits, and PR submission — zero manual steps.",
  },
  {
    icon: Zap,
    title: "Rate-Limit Intelligent",
    description:
      "Token bucket concurrency controller adapts to free-tier and premium model limits automatically.",
  },
];

const steps = [
  { num: "01", label: "Connect Repository", detail: "Paste any GitHub URL or authorize OAuth" },
  { num: "02", label: "Select AI Engine", detail: "OpenRouter free/paid models or custom endpoints" },
  { num: "03", label: "Generate Saaya", detail: "Multi-agent pipeline builds your knowledge base" },
  { num: "04", label: "Review & Merge PR", detail: "Complete documentation delivered to your repo" },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* ─── Ambient Background ─── */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-fuji-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-sakura-500/[0.03] blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] h-[300px] w-[300px] rounded-full bg-tsuki-500/[0.03] blur-[80px]" />
      </div>

      {/* ─── Navigation ─── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-50 flex items-center justify-between px-8 py-6 md:px-16"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-fuji-500 to-sakura-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-ink-50">
            紗夜 <span className="text-ink-300">Saaya</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-ink-300 transition-colors hover:text-ink-50"
          >
            <GitBranch className="h-4 w-4" />
            GitHub
          </a>
          <Link
            href="/dashboard"
            className="rounded-lg bg-ink-50 px-5 py-2.5 text-sm font-medium text-ink-950 transition-all hover:bg-white hover:shadow-glow"
          >
            Launch App
          </Link>
        </div>
      </motion.nav>

      {/* ─── Hero Section ─── */}
      <section className="relative z-10 flex flex-col items-center px-6 pt-24 pb-32 text-center md:pt-36">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl"
        >
          <motion.div
            variants={itemVariants}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-850/80 px-4 py-2 text-sm text-ink-300 backdrop-blur-sm"
          >
            <span className="h-2 w-2 rounded-full bg-matcha-500 animate-pulse-slow" />
            Open Source • Multi-Agent AI • Enterprise Grade
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl"
          >
            <span className="text-ink-50">Repository knowledge,</span>
            <br />
            <span className="text-gradient-fuji">generated like shadow.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ink-300 md:text-xl"
          >
            Saaya scans any GitHub repository, constructs a deep hierarchical
            knowledge graph, and generates a complete documentation suite —
            delivered as a clean Pull Request. Like a shadow that perfectly
            mirrors its source.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/dashboard"
              className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-fuji-600 to-fuji-500 px-8 py-4 text-base font-medium text-white shadow-glow transition-all hover:shadow-[0_0_60px_-8px_rgba(139,92,246,0.3)] hover:brightness-110"
            >
              Generate Your Saaya
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-xl border border-ink-700 px-8 py-4 text-base text-ink-200 transition-all hover:border-ink-500 hover:bg-ink-850"
            >
              <FileText className="h-5 w-5" />
              See How It Works
            </a>
          </motion.div>
        </motion.div>

        {/* ─── Floating Kanji Decoration ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.04 }}
          transition={{ delay: 1, duration: 2 }}
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[20rem] font-bold text-ink-50 md:text-[28rem]"
        >
          紗
        </motion.div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="grid gap-6 md:grid-cols-2"
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-ink-800 bg-ink-900/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-ink-600 hover:bg-ink-850/80 hover:shadow-glow"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-800 transition-colors group-hover:bg-fuji-500/10">
                <feature.icon className="h-6 w-6 text-fuji-400" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-ink-50">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-ink-300">
                {feature.description}
              </p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-5xl px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="mb-16 text-center text-3xl font-bold text-ink-50 md:text-4xl">
            Four steps to <span className="text-gradient-tsuki">complete knowledge</span>
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-700 bg-ink-850 text-lg font-bold text-fuji-400">
                  {step.num}
                </div>
                <h3 className="mb-2 font-semibold text-ink-100">{step.label}</h3>
                <p className="text-sm text-ink-400">{step.detail}</p>
                {i < steps.length - 1 && (
                  <div className="absolute top-7 left-[calc(50%+2rem)] hidden h-px w-[calc(100%-4rem)] bg-gradient-to-r from-ink-600 to-transparent md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── Output Preview ─── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="glass-raised overflow-hidden rounded-2xl"
        >
          <div className="flex items-center gap-2 border-b border-ink-800 px-6 py-4">
            <div className="h-3 w-3 rounded-full bg-ink-600" />
            <div className="h-3 w-3 rounded-full bg-ink-600" />
            <div className="h-3 w-3 rounded-full bg-ink-600" />
            <span className="ml-4 text-sm text-ink-400 font-mono">
              .saaya/repowiki/
            </span>
          </div>
          <div className="p-6 font-mono text-sm leading-relaxed text-ink-300">
            <p className="text-ink-500">{"├── en/content/"}</p>
            <p className="text-ink-200">{"│   ├── Getting Started.md"}</p>
            <p className="text-ink-200">{"│   ├── Architecture Overview/"}</p>
            <p className="text-ink-200">{"│   ├── Backend API/"}</p>
            <p className="text-ink-200">{"│   ├── Database Schema/"}</p>
            <p className="text-ink-200">{"│   └── Security & Compliance/"}</p>
            <p className="mt-2 text-ink-500">{"├── knowledge/en/"}</p>
            <p className="text-matcha-400">{"│   ├── _index.yaml"}</p>
            <p className="text-fuji-300">{"│   ├── [Module]/overview.md"}</p>
            <p className="text-fuji-300">{"│   ├── [Module]/architecture_design.md"}</p>
            <p className="text-fuji-300">{"│   ├── [Module]/tech_stack.md"}</p>
            <p className="text-fuji-300">{"│   └── [Module]/_module.yaml"}</p>
            <p className="mt-2 text-ink-500">{"└── en/meta/"}</p>
            <p className="text-sakura-400">{"    └── repowiki-metadata.json"}</p>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-ink-800 px-8 py-12 text-center">
        <p className="text-sm text-ink-400">
          紗夜 Saaya — Open source repository knowledge generator.
        </p>
        <p className="mt-2 text-xs text-ink-500">
          Built for AI agents & developers who seek understanding.
        </p>
      </footer>
    </main>
  );
}
