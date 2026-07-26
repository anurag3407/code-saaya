import { NextResponse } from "next/server";

interface OpenRouterModelRaw {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: string;
    completion: string;
    request?: string;
  };
  context_length: number;
}

export interface OpenRouterModelFormatted {
  id: string;
  name: string;
  description: string;
  context_length: number;
  is_free: boolean;
  pricing: {
    prompt: string;
    completion: string;
    promptPer1M: string;
    completionPer1M: string;
  };
}

/**
 * Fetches live models from OpenRouter API and categorizes them
 * into free and paid tiers with formatted pricing.
 */
export async function GET() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch models from OpenRouter" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawModels: OpenRouterModelRaw[] = data.data || [];

    const models: OpenRouterModelFormatted[] = rawModels
      .filter((m) => m.id && m.name)
      .map((m) => {
        const promptPrice = parseFloat(m.pricing?.prompt || "0");
        const completionPrice = parseFloat(m.pricing?.completion || "0");
        const isFree = promptPrice === 0 && completionPrice === 0;

        return {
          id: m.id,
          name: m.name,
          description: m.description || "",
          context_length: m.context_length || 4096,
          is_free: isFree,
          pricing: {
            prompt: m.pricing?.prompt || "0",
            completion: m.pricing?.completion || "0",
            promptPer1M: isFree
              ? "Free"
              : `$${(promptPrice * 1_000_000).toFixed(2)}`,
            completionPer1M: isFree
              ? "Free"
              : `$${(completionPrice * 1_000_000).toFixed(2)}`,
          },
        };
      })
      // Sort: free first, then by name
      .sort((a, b) => {
        if (a.is_free && !b.is_free) return -1;
        if (!a.is_free && b.is_free) return 1;
        return a.name.localeCompare(b.name);
      });

    const freeModels = models.filter((m) => m.is_free);
    const paidModels = models.filter((m) => !m.is_free);

    return NextResponse.json({
      models,
      free: freeModels,
      paid: paidModels,
      total: models.length,
      freeCount: freeModels.length,
      paidCount: paidModels.length,
    });
  } catch (error) {
    console.error("[/api/openrouter/models] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", models: [], free: [], paid: [] },
      { status: 500 }
    );
  }
}
