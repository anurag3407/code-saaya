"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileCode, Bot, Database, Network, Copy, Check } from "lucide-react";

const showcaseTabs = [
  {
    id: "claude",
    label: "CLAUDE.md & AGENTS.md",
    icon: Bot,
    color: "text-sakura-400",
    filename: "CLAUDE.md",
    code: `# AI Agent Guidance & Architectural Map

This repository includes a pre-indexed knowledge base under repowiki/:

## Essential Context References for AI Agents (Claude Code, Antigravity, Cursor, Aider)
Whenever working on features, bug fixes, or refactoring, inspect these maps first:

- 🏗️ System Architecture: repowiki/en/content/Architecture Overview/System Architecture.md
- 🗄️ Database Schemas: repowiki/en/content/Database Schema/Database Schema.md
- 🔌 Backend API Services: repowiki/en/content/Backend API/Backend API.md
- ⚡ Background Workers: repowiki/en/content/Background Workers/Worker Architecture.md

## Coding Conventions & Execution Commands
Refer to 6-file module suites under repowiki/knowledge/en/:
1. coding_conventions.md — Code style, error handling, layering
2. unique_setup_and_commands.md — Build, run, and test execution commands`,
  },
  {
    id: "schema",
    label: "Database Schema.md",
    icon: Database,
    color: "text-fuji-300",
    filename: "en/content/Database Schema/Database Schema.md",
    code: `<cite>
**Referenced Files in This Document**
- [schema.prisma](file://prisma/schema.prisma)
- [drizzle.config.ts](file://drizzle.config.ts)
</cite>

# Database Schema & Data Models

## Table of Contents
1. [Core Entities](#1-core-entities)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)

## 2. Entity Relationship Diagram
\`\`\`mermaid
erDiagram
    USERS ||--o{ WORKSPACES : owns
    WORKSPACES ||--o{ BOTS : contains
    WORKSPACES ||--o{ CONVERSATIONS : logs
    CONVERSATIONS ||--o{ MESSAGES : stores
\`\`\`

**Section sources:** \`prisma/schema.prisma\``,
  },
  {
    id: "conventions",
    label: "coding_conventions.md",
    icon: FileCode,
    color: "text-tsuki-300",
    filename: "knowledge/en/PostgreSQL/coding_conventions.md",
    code: `# PostgreSQL & Drizzle ORM Coding Conventions

## 1. Naming Standards
- Table names: snake_case plural (e.g. \`workspace_users\`, \`bot_configs\`)
- Primary Keys: \`id\` column using UUIDv4 or Cuid2
- Foreign Keys: \`<singular_table>_id\` (e.g. \`workspace_id\`)

## 2. Error Handling & Transactions
- Wrap multi-table mutations inside \`db.transaction(async (tx) => { ... })\`
- Throw typed \`AppError\` with \`HttpStatus.UNPROCESSABLE_ENTITY\` on constraint violations`,
  },
  {
    id: "metadata",
    label: "repowiki-metadata.json",
    icon: Network,
    color: "text-matcha-400",
    filename: "en/meta/repowiki-metadata.json",
    code: `{
  "knowledge_relations": [
    {
      "id": 1,
      "source_id": "wiki-node-db-schema",
      "target_id": "knowledge-postgres-drizzle",
      "relationship_type": "PARENT_CHILD"
    }
  ],
  "wiki_catalogs": [
    { "name": "Database Schema", "description": "core-entities" }
  ],
  "wiki_repo": { "progress_status": "completed", "wiki_present_status": "COMPLETED" }
}`,
  },
];

export function CodeShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(showcaseTabs[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="code-showcase" className="relative px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-tsuki-400">
            LIVE OUTPUT SHOWCASE
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-50 sm:text-5xl">
            Insanely Detailed <span className="text-gradient-fuji">Generated Output</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base text-ink-300">
            Inspect live examples of the articles, AI agent instructions, and knowledge graph JSON delivered to your repository.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {showcaseTabs.map((tab, idx) => {
            const isActive = activeTab === idx;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2.5 rounded-xl border px-5 py-3 text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? "glass-raised border-fuji-500/60 text-ink-50 shadow-glow"
                    : "border-ink-800 bg-ink-900/40 text-ink-400 hover:border-ink-700 hover:text-ink-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Code Viewer */}
        <div className="glass-raised mt-8 overflow-hidden rounded-2xl border border-ink-800 shadow-elevated">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-ink-800/80 bg-ink-950/80 px-6 py-3">
            <div className="flex items-center gap-3 font-mono text-xs text-ink-300">
              <span className="text-fuji-400">📄</span>
              <span>{showcaseTabs[activeTab].filename}</span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg border border-ink-800 bg-ink-900/60 px-3 py-1.5 font-mono text-xs text-ink-300 transition-colors hover:border-ink-700 hover:text-ink-50"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-matcha-400" />
                  <span className="text-matcha-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-ink-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Content */}
          <div className="min-h-[360px] bg-ink-950/90 p-6 font-mono text-xs leading-relaxed text-ink-200 sm:p-8 overflow-x-auto">
            <AnimatePresence mode="wait">
              <motion.pre
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <code>{showcaseTabs[activeTab].code}</code>
              </motion.pre>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
