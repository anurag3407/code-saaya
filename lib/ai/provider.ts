import OpenAI from "openai";
import type { ProviderType } from "@/types/saaya";

export interface AIProviderConfig {
  providerType: ProviderType;
  apiKey: string;
  baseUrl?: string;
  model: string;
  maxRpm?: number;
  maxConcurrency?: number;
}

/**
 * Creates an OpenAI-compatible client for any provider
 * Works with OpenRouter, custom endpoints (Ollama, vLLM, etc.)
 */
export function createAIClient(config: AIProviderConfig): OpenAI {
  const baseURL =
    config.providerType === "OPENROUTER"
      ? "https://openrouter.ai/api/v1"
      : config.baseUrl || "http://localhost:11434/v1";

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL,
    defaultHeaders:
      config.providerType === "OPENROUTER"
        ? {
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "Saaya RepoWiki Generator",
          }
        : undefined,
  });
}

/**
 * Determines if a model is free-tier based on its ID
 */
export function isFreeModel(modelId: string): boolean {
  return modelId.includes(":free");
}

/**
 * Gets rate limit configuration for a model
 */
export function getRateLimits(modelId: string, customRpm?: number, customConcurrency?: number) {
  if (customRpm && customConcurrency) {
    return { maxRpm: customRpm, maxConcurrency: customConcurrency };
  }
  return isFreeModel(modelId)
    ? { maxRpm: 15, maxConcurrency: 2 }
    : { maxRpm: 200, maxConcurrency: 10 };
}
