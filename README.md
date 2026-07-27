<p align="center">
  <img src="katana.png" alt="Saaya Logo" width="180">
</p>

<!-- <p align="center">
  <img src="public/banner.png" alt="Code Saaya" width="100%">
</p> -->

```
  ██████╗  ██████╗ ██████╗ ███████╗      ███████╗ █████╗  █████╗ ██╗   ██╗█████╗ 
 ██╔════╝ ██╔═══██╗██╔══██╗██╔════╝      ██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗
 ██║      ██║   ██║██║  ██║█████╗  █████╗███████╗███████║███████║ ╚████╔╝ ███████║
 ██║      ██║   ██║██║  ██║██╔══╝  ╚════╝╚════██║██╔══██║██╔══██║  ╚██╔╝  ██╔══██╗
 ╚██████╗ ╚██████╔╝██████╔╝███████╗      ███████║██║  ██║██║  ██║   ██║   ██║  ██║
  ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝      ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝
```

<p align="center">
  <a href="https://github.com/anurag3407/code-saaya">Code Saaya Engine</a> | <a href="https://github.com/anurag3407/code-saaya">GitHub Repository</a>
</p>
<p align="center">
  <a href="https://github.com/anurag3407/code-saaya"><img src="https://img.shields.io/badge/Docs-code--saaya-FFD700?style=for-the-badge" alt="Documentation"></a>
  <a href="https://github.com/anurag3407/code-saaya/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License: MIT"></a>
  <a href="https://github.com/anurag3407/code-saaya"><img src="https://img.shields.io/badge/Built%20by-SaayaLabs-blueviolet?style=for-the-badge" alt="Built by SaayaLabs"></a>
</p>

**The autonomous AI repository knowledge & documentation engine built by SaayaLabs.** It turns any software repository into a pre-indexed, enterprise-grade knowledge base for human engineers and AI coding agents (**Claude Code**, **Antigravity**, **Cursor**, **Aider**, **Devin**). Powered by a stateful **LangGraph multi-agent pipeline**, it extracts deep database schemas, API contracts, async worker queues, and 6-file technology knowledge modules, auto-delivering `.saaya/repowiki/`, `CLAUDE.md`, and `AGENTS.md` directly via GitHub Pull Requests.

Use any AI model you want — OpenRouter (Claude 3.5 Sonnet, GPT-4o, DeepSeek R1, Llama 3.3), OpenAI API, or custom local endpoints (Ollama, vLLM). Switch models with zero code changes or lock-in.

<table>
<tr><td><b>Multi-Pass LangGraph Pipeline</b></td><td>Stateful execution graph orchestrating specialized AI nodes: <code>planTaxonomy</code> → <code>generateCatalogs</code> → <code>generateModuleCards</code> → <code>writeArticles</code> → <code>buildMetadata</code>. Resilient checkpointing allows jobs to resume seamlessly.</td></tr>
<tr><td><b>AI Agent Auto-Discovery</b></td><td>Automatically generates root <code>CLAUDE.md</code> and <code>AGENTS.md</code> guidelines. Coding agents (Claude Code, Antigravity, Cursor, Aider) auto-read repo architecture, database schemas, coding rules, and verification commands upon project load.</td></tr>
<tr><td><b>Dual Knowledge Architecture</b></td><td>Human-readable Markdown sub-articles with Mermaid sequence & ER diagrams, payload definitions, and file citations (<code>file://...</code>) + machine-parseable 6-file technology knowledge suites (<code>_module.yaml</code>).</td></tr>
<tr><td><b>Tech-Stack Auto-Discovery</b></td><td>Scans imports and dependencies to identify 15–25 technology components (PostgreSQL, Redis, Better Auth, BullMQ, Pusher, Voyage AI, Turborepo) and generates 6-file documentation suites for each.</td></tr>
<tr><td><b>Automated GitHub PR Delivery</b></td><td>Octokit-powered cross-repo PR automation using base64 blob tree construction. Supports direct branch commits or fork-and-PR workflows for public and private repositories.</td></tr>
<tr><td><b>Token-Bucket Rate Limiter</b></td><td>Adaptive concurrency controller (<code>RateLimitedTaskQueue</code>) that dynamically throttles requests to respect free-tier and premium LLM rate limits without HTTP 429 errors.</td></tr>
<tr><td><b>Realtime Logs & Job Controls</b></td><td>Live SSE/Appwrite terminal execution stream, log search & level filters (Info, Success, Warn, Error), log text export, and inline Pause, Resume, and Delete job controls.</td></tr>
</table>

---

## Quick Setup & Local Installation

### Prerequisites
- **Node.js**: `v20.9.0` or higher
- **npm** or **pnpm**
- **Clerk Account**: For authentication keys
- **Appwrite Instance**: Cloud or self-hosted project

### 1. Clone the Repository

```bash
git clone https://github.com/anurag3407/code-saaya.git
cd code-saaya
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Appwrite Database
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_admin_api_key
APPWRITE_DATABASE_ID=saaya_db

# OpenRouter Integration
OPENROUTER_AUTH_URL=https://openrouter.ai/auth
OPENROUTER_API_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=sk-or-v1-...

# GitHub Access Token (for PR creation)
GITHUB_TOKEN=ghp_...
```

### 4. Setup Database & Start Server

Initialize Appwrite database collections and start the Next.js development server:

```bash
npx tsx scripts/setup-appwrite.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the dashboard.

---

## Quick Reference

| Action | Command / Location |
| --- | --- |
| Start Dev Server | `npm run dev` |
| Initialize Appwrite DB | `npx tsx scripts/setup-appwrite.ts` |
| Check TypeScript Types | `npx tsc --noEmit` |
| Build Production Bundle | `npm run build` |
| Run ESLint | `npm run lint` |
| New Generation Wizard | Navigate to `/dashboard/new` |
| AI Provider Settings | Navigate to `/settings` |

---

## Key Features Breakdown

### 1. Multi-Agent Pipeline Graph
Saaya's LangGraph engine breaks down documentation into distinct execution nodes:
- `planTaxonomy`: Scans file trees & schemas to partition codebase into nested domain folders.
- `generateCatalogs`: Plans 50–100+ nested sub-articles across architecture, database, APIs, workers, and frontend.
- `generateModuleCards`: Auto-discovers tech stack components and writes 6-file module suites (`overview.md`, `architecture_design.md`, `tech_stack.md`, `coding_conventions.md`, `unique_setup_and_commands.md`, `_module.yaml`).
- `writeArticles`: Writes deep Markdown articles with sequence diagrams, code contracts, and file citations (`file://...`).
- `buildMetadata`: Connects `knowledge_relations` and links `CLAUDE.md` & `AGENTS.md` guidelines.

### 2. Form Lock Validation
The generation wizard enforces strict step-by-step validation: Step 2 ("AI Engine") and model selection remain locked until a valid GitHub repository URL (`https://github.com/owner/repo`) is entered.

### 3. Job Controls & Detailed Terminal Logs
- **Pause / Resume**: Pause long-running generation jobs and resume execution from saved checkpoints.
- **Delete / Cancel**: Cancel running jobs or remove job history documents.
- **Terminal Filters**: Filter live logs by level (Info, Success, Warn, Error) or search keywords, and export logs to `.txt`.

---

## Architecture & Technology Stack

| Layer | Technology |
| --- | --- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) & React 19 |
| **Language** | TypeScript |
| **Styling & Motion** | Tailwind CSS v4, Framer Motion, GSAP, Lucide Icons |
| **Authentication** | [Clerk](https://clerk.com/) (`@clerk/nextjs`) |
| **Database & Realtime** | [Appwrite](https://appwrite.io/) (`node-appwrite`) |
| **AI Orchestration** | LangGraph (`@langchain/langgraph`), OpenAI SDK |
| **GitHub Automation** | `@octokit/rest` (Base64 Blob Git Trees) |

---

## Contributing

We welcome contributions! Please feel free to open issues or submit pull requests on [GitHub](https://github.com/anurag3407/code-saaya).

```bash
git clone https://github.com/anurag3407/code-saaya.git
cd code-saaya
npm install
npx tsc --noEmit
```

---

## License

MIT — see [LICENSE](LICENSE).

Built with passion by SaayaLabs.
