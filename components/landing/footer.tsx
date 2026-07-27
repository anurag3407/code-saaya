"use client";

import Link from "next/link";
import Image from "next/image";
import { GitBranch } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-ink-800/80 bg-ink-950 px-6 py-12 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
        {/* Brand Stamp (English Only) */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuji-600/20 border border-fuji-500/30 overflow-hidden p-1">
            <Image src="/katana.png" alt="Katana Logo" width={24} height={24} className="h-full w-full object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-bold text-gradient-fuji">
              Saaya
            </span>
            <span className="font-mono text-xs text-ink-400">|</span>
            <span className="font-mono text-xs text-ink-400">
              Autonomous AI Repository Knowledge Suite
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 rounded-full border border-ink-800 bg-ink-900/60 px-3 py-1 font-mono text-xs text-ink-300">
          <span className="h-2 w-2 rounded-full bg-matcha-400 animate-pulse" />
          <span>System Operational // v2.0 Engine</span>
        </div>

        {/* Links & Copyright */}
        <div className="flex items-center gap-6 font-mono text-xs text-ink-400">
          <Link href="/dashboard" className="transition-colors hover:text-ink-50">
            Dashboard
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 transition-colors hover:text-ink-50"
          >
            <GitBranch className="h-3.5 w-3.5" />
            GitHub
          </a>
          <span>© 2026 Saaya Engine. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
