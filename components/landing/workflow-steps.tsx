"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Scan, Cpu, FileCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    stepNum: "01",
    title: "Universal Codebase Ingestion",
    description:
      "Paste any public or private GitHub repository URL. Saaya automatically scans directory trees, ORM schemas, route handlers, async workers, and configurations across any language.",
    icon: Scan,
    previewCode: `➜ saaya scan https://github.com/org/repo
[Scanner] Discovered 240 files across 12 packages
[Scanner] Sampled 18 core schemas & controllers`,
  },
  {
    stepNum: "02",
    title: "Multi-Pass Domain & Tech Extraction",
    description:
      "LangGraph agents analyze dependencies to auto-discover 15-25 specialized technology stack topics and partition the repository into nested functional domains.",
    icon: Cpu,
    previewCode: `[TechExtractor] Discovered: PostgreSQL, Redis, Better Auth, Pusher
[Planner] Planned 72 sub-articles in Database, API, Workers, Frontend`,
  },
  {
    stepNum: "03",
    title: "Deep Article & Diagram Generation",
    description:
      "Generates 100+ nested markdown articles embedded with Mermaid sequence diagrams, class/ER diagrams, type contracts, file citations (<cite>), and execution commands.",
    icon: FileCheck,
    previewCode: `[Writer] Generated Architecture Overview/System Architecture.md
[Writer] Generated Database Schema/Core Entities.md (Mermaid ER)
[Writer] Generated knowledge/en/PostgreSQL/coding_conventions.md`,
  },
  {
    stepNum: "04",
    title: "Automated PR & Agent Linking",
    description:
      "Delivers the complete documentation suite, knowledge graph metadata, and root CLAUDE.md & AGENTS.md guidelines directly to your GitHub repository via PR.",
    icon: GitBranch,
    previewCode: `[GitHub] Committed 368 files to branch docs/saaya-repowiki
[GitHub] Created PR #42 on upstream target repository!`,
  },
];

export function WorkflowSteps() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="workflow" className="relative border-t border-ink-800/80 bg-ink-950/80 py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        {/* Section Title */}
        <div className="flex flex-col items-center text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-sakura-400">
            4-STEP PIPELINE WORKFLOW
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-50 sm:text-5xl">
            From Codebase to <span className="text-gradient-fuji">Knowledge Base</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base text-ink-300">
            A fully autonomous 4-stage pipeline that runs without manual intervention.
          </p>
        </div>

        {/* Workflow Grid */}
        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Step Selection Buttons (Left 5 Cols) */}
          <div className="space-y-4 lg:col-span-5">
            {steps.map((s, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={s.stepNum}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left transition-all duration-300 rounded-2xl p-5 border ${
                    isActive
                      ? "glass-raised border-fuji-500/60 shadow-glow"
                      : "border-ink-800/80 bg-ink-900/30 hover:border-ink-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-800 font-mono text-xs font-bold text-fuji-300 border border-ink-700">
                        {s.stepNum}
                      </span>
                      <span className="font-mono text-xs text-ink-400">STEP {s.stepNum}</span>
                    </div>
                    {isActive && <ArrowRight className="h-4 w-4 text-fuji-400" />}
                  </div>

                  <h3 className="mt-3 font-display text-lg font-bold text-ink-50">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-xs text-ink-300 line-clamp-2 leading-relaxed">
                    {s.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Step Content Preview (Right 7 Cols) */}
          <div className="lg:col-span-7">
            <div className="glass-raised h-full overflow-hidden rounded-2xl border border-ink-800 p-8 flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuji-500/10 text-fuji-400 border border-fuji-500/20">
                      {(() => {
                        const Icon = steps[activeStep].icon;
                        return <Icon className="h-6 w-6" />;
                      })()}
                    </div>
                    <div>
                      <span className="font-mono text-xs text-fuji-400">
                        STAGE {steps[activeStep].stepNum}
                      </span>
                      <h4 className="font-display text-2xl font-bold text-ink-50">
                        {steps[activeStep].title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-sm text-ink-200 leading-relaxed font-sans">
                    {steps[activeStep].description}
                  </p>

                  <div className="rounded-xl border border-ink-800 bg-ink-950/90 p-5 font-mono text-xs text-ink-200 leading-relaxed">
                    <div className="flex items-center justify-between border-b border-ink-800/80 pb-2 mb-3">
                      <span className="text-[10px] text-ink-400 uppercase">Live Pipeline Stream</span>
                      <span className="flex h-2 w-2 rounded-full bg-matcha-400 animate-pulse" />
                    </div>
                    <pre className="text-fuji-300 overflow-x-auto">
                      {steps[activeStep].previewCode}
                    </pre>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
