import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import fs from "fs";
import path from "path";
import { createAdminClient, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";

const SETTINGS_FILE = path.join(process.cwd(), ".saaya-settings-cache.json");

interface SettingsCache {
  openrouter?: {
    api_key?: string;
    base_url?: string;
    selected_model?: string;
  };
  custom?: {
    base_url?: string;
    api_key?: string;
    selected_model?: string;
    max_rpm?: number;
    max_tpm?: number;
    max_concurrency?: number;
  };
}

function loadSettingsFromDisk(): SettingsCache {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
    }
  } catch {
    // ignore
  }
  return {};
}

function saveSettingsToDisk(data: SettingsCache): void {
  try {
    const existing = loadSettingsFromDisk();
    const merged = {
      openrouter: data.openrouter || existing.openrouter,
      custom: data.custom || existing.custom,
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

/**
 * GET /api/settings
 * Returns the user's AI provider configurations (OpenRouter + Custom endpoint)
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const diskSettings = loadSettingsFromDisk();

    try {
      const { databases } = createAdminClient();
      const providers = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.AI_PROVIDERS,
        [Query.equal("user_id", userId)]
      );

      const openrouterDoc = providers.documents.find(
        (d) => d.provider_type === "OPENROUTER"
      );
      const customDoc = providers.documents.find(
        (d) => d.provider_type === "CUSTOM"
      );

      return NextResponse.json({
        openrouter: openrouterDoc
          ? {
              api_key: openrouterDoc.api_key || diskSettings.openrouter?.api_key || "",
              base_url: openrouterDoc.base_url || "https://openrouter.ai/api/v1",
              selected_model: openrouterDoc.selected_model || diskSettings.openrouter?.selected_model || "",
            }
          : diskSettings.openrouter || null,
        custom: customDoc
          ? {
              base_url: customDoc.base_url || diskSettings.custom?.base_url || "",
              api_key: customDoc.api_key || diskSettings.custom?.api_key || "",
              selected_model: customDoc.selected_model || diskSettings.custom?.selected_model || "",
              max_rpm: customDoc.max_rpm || diskSettings.custom?.max_rpm || 60,
              max_tpm: customDoc.max_tpm || diskSettings.custom?.max_tpm || 100000,
              max_concurrency: customDoc.max_concurrency || diskSettings.custom?.max_concurrency || 4,
            }
          : diskSettings.custom || null,
      });
    } catch {
      // Fallback to disk settings if Appwrite fails
      return NextResponse.json({
        openrouter: diskSettings.openrouter || null,
        custom: diskSettings.custom || null,
      });
    }
  } catch (error) {
    console.error("[/api/settings] GET Error:", error);
    return NextResponse.json({ openrouter: null, custom: null }, { status: 200 });
  }
}

/**
 * POST /api/settings
 * Persists the user's AI provider configurations to Appwrite and local disk
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Always save to disk cache first
    saveSettingsToDisk({
      openrouter: body.openrouter,
      custom: body.custom,
    });

    try {
      const { databases } = createAdminClient();

      // --- Upsert OpenRouter provider ---
      if (body.openrouter?.api_key || body.openrouter?.selected_model) {
        const existing = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.AI_PROVIDERS,
          [
            Query.equal("user_id", userId),
            Query.equal("provider_type", "OPENROUTER"),
          ]
        );

        const data = {
          api_key: body.openrouter.api_key || "",
          base_url: "https://openrouter.ai/api/v1",
          selected_model: body.openrouter.selected_model || "",
        };

        if (existing.documents.length > 0) {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.AI_PROVIDERS,
            existing.documents[0].$id,
            data
          );
        } else {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.AI_PROVIDERS,
            "unique()",
            {
              user_id: userId,
              provider_type: "OPENROUTER",
              is_free_tier: true,
              max_rpm: 15,
              max_tpm: 100000,
              max_concurrency: 2,
              ...data,
            }
          );
        }
      }

      // --- Upsert Custom endpoint provider ---
      if (body.custom?.base_url || body.custom?.api_key || body.custom?.selected_model) {
        const existing = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.AI_PROVIDERS,
          [
            Query.equal("user_id", userId),
            Query.equal("provider_type", "CUSTOM"),
          ]
        );

        const data = {
          base_url: body.custom.base_url || "",
          api_key: body.custom.api_key || "",
          selected_model: body.custom.selected_model || "",
          max_rpm: body.custom.max_rpm || 60,
          max_tpm: body.custom.max_tpm || 100000,
          max_concurrency: body.custom.max_concurrency || 4,
        };

        if (existing.documents.length > 0) {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.AI_PROVIDERS,
            existing.documents[0].$id,
            data
          );
        } else {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.AI_PROVIDERS,
            "unique()",
            {
              user_id: userId,
              provider_type: "CUSTOM",
              is_free_tier: false,
              ...data,
            }
          );
        }
      }
    } catch {
      // Ignore Appwrite errors if disk save succeeded
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/settings] POST Error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
