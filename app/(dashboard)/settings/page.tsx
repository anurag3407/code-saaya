"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Key, Globe, Cpu, Save, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-fuji-400" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const openrouterStatus = searchParams.get("openrouter");
  const errorStatus = searchParams.get("error");

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [customRpm, setCustomRpm] = useState(60);
  const [customTpm, setCustomTpm] = useState(100000);
  const [customConcurrency, setCustomConcurrency] = useState(4);

  // Load existing provider config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.openrouter?.api_key) setOpenrouterKey(data.openrouter.api_key);
          if (data.custom) {
            setCustomBaseUrl(data.custom.base_url || "");
            setCustomApiKey(data.custom.api_key || "");
            setCustomModel(data.custom.selected_model || "");
            setCustomRpm(data.custom.max_rpm || 60);
            setCustomTpm(data.custom.max_tpm || 100000);
            setCustomConcurrency(data.custom.max_concurrency || 4);
          }
        }
      } catch {
        // silently fail
      }
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openrouter: { api_key: openrouterKey },
          custom: {
            base_url: customBaseUrl,
            api_key: customApiKey,
            selected_model: customModel,
            max_rpm: customRpm,
            max_tpm: customTpm,
            max_concurrency: customConcurrency,
          },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">AI Provider Settings</h1>
        <p className="mt-1 text-sm text-ink-400">
          Configure your AI engines for Saaya generation
        </p>
      </div>

      {/* OAuth Status Banners */}
      {openrouterStatus === "connected" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-matcha-500/30 bg-matcha-500/10 px-5 py-3.5 text-sm text-matcha-400"
        >
          <CheckCircle2 className="h-5 w-5" />
          OpenRouter connected successfully! Your API key has been stored.
        </motion.div>
      )}
      {errorStatus && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm text-red-400"
        >
          <XCircle className="h-5 w-5" />
          {errorStatus === "no_code" && "No authorization code received. Please try again."}
          {errorStatus === "token_exchange_failed" && "Failed to exchange OAuth code. Please try again."}
          {errorStatus === "internal" && "An internal error occurred. Please try again."}
        </motion.div>
      )}

      {/* OpenRouter Section */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-ink-800 bg-ink-900/50 p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-matcha-500/10">
            <Globe className="h-5 w-5 text-matcha-400" />
          </div>
          <div>
            <h2 className="font-semibold text-ink-100">OpenRouter</h2>
            <p className="text-xs text-ink-400">
              OAuth-connected model access with free & paid tiers
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-200">
              API Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                type="password"
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-..."
                className="w-full rounded-xl border border-ink-700 bg-ink-850 py-3 pl-10 pr-4 text-ink-50 placeholder-ink-500 outline-none focus:border-fuji-500"
              />
            </div>
          </div>
          <a
            href={`https://openrouter.ai/auth?callback_url=${encodeURIComponent(
              typeof window !== "undefined"
                ? `${window.location.origin}/api/openrouter/auth`
                : ""
            )}`}
            className="inline-flex items-center gap-2 rounded-lg border border-matcha-500/30 bg-matcha-500/10 px-4 py-2.5 text-sm text-matcha-400 transition-all hover:bg-matcha-500/20"
          >
            <Globe className="h-4 w-4" />
            Connect via OpenRouter OAuth
          </a>
        </div>
      </motion.section>

      {/* Custom Endpoint Section */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-ink-800 bg-ink-900/50 p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuji-500/10">
            <Cpu className="h-5 w-5 text-fuji-400" />
          </div>
          <div>
            <h2 className="font-semibold text-ink-100">
              Custom OpenAI-Compatible Endpoint
            </h2>
            <p className="text-xs text-ink-400">
              Ollama, vLLM, LMStudio, Together.ai, DeepSeek
            </p>
          </div>
        </div>

        <div className="space-y-4">
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
              placeholder="sk-... (optional for local)"
              className="w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 text-ink-50 placeholder-ink-500 outline-none focus:border-fuji-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-200">
              Model ID
            </label>
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="llama3.1:70b-instruct"
              className="w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 text-ink-50 placeholder-ink-500 outline-none focus:border-fuji-500"
            />
          </div>

          {/* Rate Limit Controls */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-ink-300">
                Max RPM
              </label>
              <input
                type="number"
                value={customRpm}
                onChange={(e) => setCustomRpm(Number(e.target.value))}
                className="w-full rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-ink-50 outline-none focus:border-fuji-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-ink-300">
                Max TPM
              </label>
              <input
                type="number"
                value={customTpm}
                onChange={(e) => setCustomTpm(Number(e.target.value))}
                className="w-full rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-ink-50 outline-none focus:border-fuji-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-ink-300">
                Concurrency
              </label>
              <input
                type="number"
                value={customConcurrency}
                onChange={(e) => setCustomConcurrency(Number(e.target.value))}
                className="w-full rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-ink-50 outline-none focus:border-fuji-500"
              />
            </div>
          </div>

          <p className="text-xs text-ink-500">
            The rate limiter will spawn at most{" "}
            <span className="text-fuji-300">{customConcurrency}</span> parallel
            agents, throttled to{" "}
            <span className="text-fuji-300">{customRpm}</span> requests/minute.
          </p>
        </div>
      </motion.section>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-medium transition-all",
          saved
            ? "bg-matcha-500/20 text-matcha-400"
            : "bg-gradient-to-r from-fuji-600 to-fuji-500 text-white hover:brightness-110 disabled:opacity-60"
        )}
      >
        {saving ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <CheckCircle2 className="h-5 w-5" />
            Saved
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Save Configuration
          </>
        )}
      </button>
    </div>
  );
}
