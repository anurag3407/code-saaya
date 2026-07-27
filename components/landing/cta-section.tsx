"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, GitBranch } from "lucide-react";

export function CTASection() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      router.push(`/dashboard/new?url=${encodeURIComponent(repoUrl.trim())}`);
    } else {
      router.push("/dashboard/new");
    }
  };

  return (
    <section className="relative overflow-hidden border-t border-ink-800/80 bg-ink-950/90 px-6 py-28 md:px-12">
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuji-600/20 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-sakura-500/15 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-5xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-sakura-500/30 bg-sakura-500/10 px-4 py-1.5 text-xs font-mono font-semibold text-sakura-300 shadow-glow-sakura"
        >
          <Sparkles className="h-4 w-4" />
          <span>INSTANT KNOWLEDGE GENERATION</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 font-display text-4xl font-extrabold tracking-tight text-ink-50 sm:text-6xl"
        >
          Transform Your Codebase in <span className="text-gradient-fuji">60 Seconds</span>.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 max-w-2xl text-base text-ink-300 sm:text-lg mx-auto"
        >
          Paste any public or private GitHub repository URL below to generate a pre-indexed Repowiki and AI agent context package.
        </motion.p>

        {/* Quick URL Input Bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onSubmit={handleSubmit}
          className="glass-raised mx-auto mt-10 flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-ink-700/80 p-3 sm:flex-row shadow-elevated"
        >
          <div className="flex w-full items-center gap-3 px-3">
            <GitBranch className="h-5 w-5 text-fuji-400 shrink-0" />
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full bg-transparent font-mono text-sm text-ink-50 placeholder-ink-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="group inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuji-600 to-sakura-500 px-6 py-3.5 text-sm font-bold text-white shadow-glow transition-all duration-300 hover:scale-105 sm:w-auto"
          >
            <span>Generate Now</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.form>
      </div>
    </section>
  );
}
