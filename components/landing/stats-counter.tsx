"use client";

import { motion } from "framer-motion";
import { Database, FileCheck, Zap, GitPullRequest } from "lucide-react";

const stats = [
  {
    icon: Database,
    number: "100%",
    label: "Pre-Indexed Accuracy",
    description: "Zero context hallucination for AI coding agents",
    numBadge: "01",
  },
  {
    icon: FileCheck,
    number: "300+",
    label: "Nested Docs per Scan",
    numberColor: "text-sakura-400",
    description: "Hierarchical sub-articles & 6-file module cards",
    numBadge: "02",
  },
  {
    icon: Zap,
    number: "80%",
    label: "Token Window Savings",
    numberColor: "text-tsuki-400",
    description: "Instant context maps for Claude Code & Cursor",
    numBadge: "03",
  },
  {
    icon: GitPullRequest,
    number: "1-Click",
    label: "GitHub PR Delivery",
    numberColor: "text-matcha-400",
    description: "Automated tree commits without manual writing",
    numBadge: "04",
  },
];

export function StatsCounter() {
  return (
    <section className="relative border-y border-ink-800/80 bg-ink-950/60 py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="glass-raised relative overflow-hidden rounded-2xl border border-ink-800 p-6 transition-all duration-300 hover:border-fuji-500/40 hover:shadow-glow"
            >
              {/* Numeric Background Badge */}
              <span className="pointer-events-none absolute right-4 bottom-2 font-mono text-6xl font-black opacity-[0.03] text-ink-50">
                {stat.numBadge}
              </span>

              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-800/80 text-fuji-400 border border-ink-700">
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-[10px] uppercase text-ink-400">
                  METRIC {stat.numBadge}
                </span>
              </div>

              <div className="mt-4">
                <span className={`font-display text-3xl font-extrabold tracking-tight ${stat.numberColor || "text-fuji-300"}`}>
                  {stat.number}
                </span>
                <h3 className="mt-1 font-sans text-sm font-semibold text-ink-100">
                  {stat.label}
                </h3>
                <p className="mt-1 text-xs text-ink-400 leading-relaxed font-sans">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
