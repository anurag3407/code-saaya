"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Cpu,
  Rocket,
  Check,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "repo" | "engine" | "confirm";

interface LiveModel {
  id: string;
  name: string;
  context_length: number;
  is_free: boolean;
  pricing: {
    promptPer1M: string;
    completionPer1M: string;
  };
}

const steps: { id: Step; label: string; icon: typeof GitBranch }[] = [
  { id: "repo", label: "Repository", icon: GitBranch },
  { id: "engine", label: "AI Engine", icon: Cpu },
  { id: "confirm", label: "Generate", icon: Rocket },
];

export default function NewSaayaPage() {
  const [currentStep, setCurrentStep] = useState<Step>("repo");
  const [repoUrl, setRepoUrl] = useState("");
  const [providerType, setProviderType] = useState<"OPENROUTER" | "CUSTOM_OPENAI">("OPENROUTER");
  const [selectedModel, setSelectedModel] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [customRpm, setCustomRpm] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live model state
  const [freeModels, setFreeModels] = useState<LiveModel[]>([]);
  const [paidModels, setPaidModels] = useState<LiveModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [showAllFree, setShowAllFree] = useState(false);
  const [showAllPaid, setShowAllPaid] = useState(false);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // Fetch live models from OpenRouter
  useEffect(() => {
    async function fetchModels() {
      setModelsLoading(true);
      try {
        const res = await fetch("/api/openrouter/models");
        if (res.ok) {
          const data = await res.json();
          setFreeModels(data.free || []);
          setPaidModels(data.paid || []);
          // Auto-select first free model
          if (data.free?.length > 0 && !selectedModel) {
            setSelectedModel(data.free[0].id);
          }
        }
      } catch {
        // silently fail
      } finally {
        setModelsLoading(false);
      }
    }
    fetchModels();
  }, [selectedModel]);

  const filteredFree = freeModels.filter(
    (m) =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearch.toLowerCase())
  );
  const filteredPaid = paidModels.filter(
    (m) =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearch.toLowerCase())
  );
  const displayedFree = showAllFree ? filteredFree : filteredFree.slice(0, 8);
  const displayedPaid = showAllPaid ? filteredPaid : filteredPaid.slice(0, 8);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl,
          providerType,
          model: providerType === "OPENROUTER" ? selectedModel : customModel,
          baseUrl: providerType === "CUSTOM_OPENAI" ? customBaseUrl : undefined,
          apiKey: providerType === "CUSTOM_OPENAI" ? customApiKey : undefined,
          maxRpm: providerType === "CUSTOM_OPENAI" ? customRpm : undefined,
        }),
      });
      const data = await res.json();
      if (data.jobId) {
        window.location.href = `/jobs/${data.jobId}`;
      }
    } catch {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-ink-50">Generate New Saaya</h1>
      <p className="mb-10 text-sm text-ink-400">
        Create a comprehensive knowledge base for any GitHub repository
      </p>

      {/* Step Indicator */}
      <div className="mb-10 flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2">
            <button
              onClick={() => i <= currentStepIndex && setCurrentStep(step.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                i === currentStepIndex
                  ? "bg-fuji-500/15 text-fuji-300"
                  : i < currentStepIndex
                    ? "bg-matcha-500/10 text-matcha-400"
                    : "bg-ink-800 text-ink-500"
              )}
            >
              {i < currentStepIndex ? (
                <Check className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
              {step.label}
            </button>
            {i < steps.length - 1 && (
              <div className="h-px w-8 bg-ink-700" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === "repo" && (
          <motion.div
            key="repo"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-ink-800 bg-ink-900/50 p-8">
              <label className="mb-2 block text-sm font-medium text-ink-200">
                GitHub Repository URL
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className="w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3.5 text-ink-50 placeholder-ink-500 outline-none transition-all focus:border-fuji-500 focus:ring-1 focus:ring-fuji-500/30"
              />
              <p className="mt-3 text-xs text-ink-500">
                Supports public repositories. For private repos, ensure your
                GitHub token has repo access.
              </p>
            </div>
            <button
              onClick={() => setCurrentStep("engine")}
              disabled={!repoUrl.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-fuji-600 to-fuji-500 py-3.5 font-medium text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </motion.div>
        )}

        {currentStep === "engine" && (
          <motion.div
            key="engine"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Provider Type Toggle */}
            <div className="flex gap-3">
              <button
                onClick={() => setProviderType("OPENROUTER")}
                className={cn(
                  "flex-1 rounded-xl border p-4 text-left transition-all",
                  providerType === "OPENROUTER"
                    ? "border-fuji-500 bg-fuji-500/10"
                    : "border-ink-700 bg-ink-900/50 hover:border-ink-500"
                )}
              >
                <span className="text-sm font-medium text-ink-100">
                  🟢 OpenRouter
                </span>
                <p className="mt-1 text-xs text-ink-400">
                  Free & paid models with OAuth
                </p>
              </button>
              <button
                onClick={() => setProviderType("CUSTOM_OPENAI")}
                className={cn(
                  "flex-1 rounded-xl border p-4 text-left transition-all",
                  providerType === "CUSTOM_OPENAI"
                    ? "border-fuji-500 bg-fuji-500/10"
                    : "border-ink-700 bg-ink-900/50 hover:border-ink-500"
                )}
              >
                <span className="text-sm font-medium text-ink-100">
                  ⚙️ Custom Endpoint
                </span>
                <p className="mt-1 text-xs text-ink-400">
                  OpenAI-compatible (Ollama, vLLM)
                </p>
              </button>
            </div>

            {providerType === "OPENROUTER" ? (
              <div className="rounded-2xl border border-ink-800 bg-ink-900/50 p-8">
                <div className="mb-4 flex items-center justify-between">
                  <label className="block text-sm font-medium text-ink-200">
                    Select Model
                  </label>
                  <span className="text-xs text-ink-500">
                    {freeModels.length + paidModels.length} models available
                  </span>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="Search models..."
                    className="w-full rounded-lg border border-ink-700 bg-ink-850 py-2.5 pl-10 pr-4 text-sm text-ink-50 placeholder-ink-500 outline-none focus:border-fuji-500"
                  />
                </div>

                {modelsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-fuji-400" />
                    <span className="ml-3 text-sm text-ink-400">Loading live models...</span>
                  </div>
                ) : (
                  <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                    {/* Free Tier */}
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-500">
                        🟢 Free Tier ({filteredFree.length}) — Concurrency: 2 | RPM: 15
                      </p>
                      <div className="space-y-1.5">
                        {displayedFree.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => setSelectedModel(model.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
                              selectedModel === model.id
                                ? "border-matcha-500 bg-matcha-500/10 text-matcha-400"
                                : "border-ink-700/60 text-ink-300 hover:border-ink-500"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{model.name}</span>
                              <span className="block truncate text-xs text-ink-500">{model.id}</span>
                            </div>
                            <span className="ml-3 shrink-0 rounded-full bg-matcha-500/10 px-2 py-0.5 text-xs text-matcha-400">
                              Free
                            </span>
                          </button>
                        ))}
                      </div>
                      {filteredFree.length > 8 && (
                        <button
                          onClick={() => setShowAllFree(!showAllFree)}
                          className="mt-2 text-xs text-fuji-400 hover:text-fuji-300"
                        >
                          {showAllFree ? "Show less" : `Show all ${filteredFree.length} free models`}
                        </button>
                      )}
                    </div>

                    {/* Paid Tier */}
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-500">
                        🔵 Premium ({filteredPaid.length}) — Concurrency: 10 | RPM: 200+
                      </p>
                      <div className="space-y-1.5">
                        {displayedPaid.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => setSelectedModel(model.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
                              selectedModel === model.id
                                ? "border-fuji-500 bg-fuji-500/10 text-fuji-300"
                                : "border-ink-700/60 text-ink-300 hover:border-ink-500"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{model.name}</span>
                              <span className="block truncate text-xs text-ink-500">{model.id}</span>
                            </div>
                            <span className="ml-3 shrink-0 text-xs text-ink-400">
                              {model.pricing.promptPer1M} / {model.pricing.completionPer1M}
                            </span>
                          </button>
                        ))}
                      </div>
                      {filteredPaid.length > 8 && (
                        <button
                          onClick={() => setShowAllPaid(!showAllPaid)}
                          className="mt-2 text-xs text-fuji-400 hover:text-fuji-300"
                        >
                          {showAllPaid ? "Show less" : `Show all ${filteredPaid.length} paid models`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-ink-800 bg-ink-900/50 p-8">
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-200">
                    Base URL
                  </label>
                  <input
                    type="url"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 text-ink-50 placeholder-ink-500 outline-none focus:border-fuji-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-200">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 text-ink-50 placeholder-ink-500 outline-none focus:border-fuji-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink-200">
                      Model ID
                    </label>
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="llama3.1:70b"
                      className="w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 text-ink-50 placeholder-ink-500 outline-none focus:border-fuji-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink-200">
                      Max RPM
                    </label>
                    <input
                      type="number"
                      value={customRpm}
                      onChange={(e) => setCustomRpm(Number(e.target.value))}
                      className="w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 text-ink-50 outline-none focus:border-fuji-500"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-ink-800/50 p-3 text-xs text-ink-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    The concurrency controller will limit parallel agents to
                    respect your specified RPM. Lower RPM = slower but safer
                    generation.
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("repo")}
                className="rounded-xl border border-ink-700 px-6 py-3.5 text-sm text-ink-300 transition-all hover:border-ink-500"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep("confirm")}
                className="flex-1 rounded-xl bg-gradient-to-r from-fuji-600 to-fuji-500 py-3.5 font-medium text-white transition-all hover:brightness-110"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-ink-800 bg-ink-900/50 p-8">
              <h3 className="mb-4 text-lg font-semibold text-ink-100">
                Generation Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-400">Repository</span>
                  <span className="text-ink-100">{repoUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Provider</span>
                  <span className="text-ink-100">
                    {providerType === "OPENROUTER" ? "OpenRouter" : "Custom Endpoint"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Model</span>
                  <span className="font-mono text-fuji-300">
                    {providerType === "OPENROUTER" ? selectedModel : customModel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Output</span>
                  <span className="text-ink-100">.saaya/repowiki/ → Pull Request</span>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-ink-800/50 p-4">
                <p className="text-xs leading-relaxed text-ink-400">
                  The multi-agent pipeline will: scan your repo structure →
                  generate taxonomy (_index.yaml) → create 6-file module cards →
                  write human-readable articles with citations & Mermaid diagrams
                  → build metadata graph → submit a Pull Request.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("engine")}
                className="rounded-xl border border-ink-700 px-6 py-3.5 text-sm text-ink-300 transition-all hover:border-ink-500"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuji-600 via-sakura-500 to-fuji-500 py-3.5 font-medium text-white shadow-glow transition-all hover:brightness-110 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Starting Pipeline...
                  </>
                ) : (
                  <>
                    <Rocket className="h-5 w-5" />
                    Generate Saaya
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
