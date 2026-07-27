"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, Terminal, ArrowRight } from "lucide-react";

export function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 w-full glass border-b border-ink-800/80 px-6 py-4 md:px-12"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* ─── Brand Logo (English Only) ─── */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuji-600 via-fuji-500 to-sakura-500 shadow-glow transition-transform duration-300 group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold tracking-tight text-gradient-fuji">
                Saaya
              </span>
              <span className="rounded-full border border-fuji-500/30 bg-fuji-500/10 px-2 py-0.5 font-mono text-[10px] uppercase font-semibold text-fuji-300">
                v2.0 Autonomous
              </span>
            </div>
            <span className="text-[11px] tracking-widest text-ink-400 font-mono uppercase">
              NEXT-GEN AI KNOWLEDGE ENGINE
            </span>
          </div>
        </Link>

        {/* ─── Nav Links ─── */}
        <div className="hidden items-center gap-8 md:flex font-sans text-sm text-ink-300">
          <a href="#features" className="transition-colors hover:text-ink-50">
            Features
          </a>
          <a href="#bento" className="transition-colors hover:text-ink-50">
            Bento Grid
          </a>
          <a href="#workflow" className="transition-colors hover:text-ink-50">
            Workflow
          </a>
          <a href="#code-showcase" className="transition-colors hover:text-ink-50">
            Agent Guidance
          </a>
        </div>

        {/* ─── Action Buttons ─── */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="hidden rounded-lg px-4 py-2 text-sm text-ink-300 transition-colors hover:text-ink-50 sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard/new"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-fuji-600 to-sakura-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:scale-[1.02] hover:shadow-glow-sakura"
          >
            <Terminal className="h-4 w-4" />
            <span>Launch Engine</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
