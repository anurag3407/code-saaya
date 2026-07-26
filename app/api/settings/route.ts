import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";

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
            api_key: openrouterDoc.api_key || "",
            base_url: openrouterDoc.base_url || "https://openrouter.ai/api/v1",
            selected_model: openrouterDoc.selected_model || "",
          }
        : null,
      custom: customDoc
        ? {
            base_url: customDoc.base_url || "",
            api_key: customDoc.api_key || "",
            selected_model: customDoc.selected_model || "",
            max_rpm: customDoc.max_rpm || 60,
            max_tpm: customDoc.max_tpm || 100000,
            max_concurrency: customDoc.max_concurrency || 4,
          }
        : null,
    });
  } catch (error) {
    console.error("[/api/settings] GET Error:", error);
    return NextResponse.json({ openrouter: null, custom: null }, { status: 200 });
  }
}

/**
 * POST /api/settings
 * Persists the user's AI provider configurations to Appwrite
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { databases } = createAdminClient();

    // --- Upsert OpenRouter provider ---
    if (body.openrouter?.api_key) {
      const existing = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.AI_PROVIDERS,
        [
          Query.equal("user_id", userId),
          Query.equal("provider_type", "OPENROUTER"),
        ]
      );

      const data = {
        api_key: body.openrouter.api_key,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/settings] POST Error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
