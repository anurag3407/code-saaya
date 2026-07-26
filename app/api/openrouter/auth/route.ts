import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";

/**
 * OpenRouter OAuth Callback
 * 
 * OpenRouter's OAuth flow redirects back with a `code` parameter.
 * We exchange it for an API key by hitting OpenRouter's token endpoint,
 * then store it in Appwrite for the authenticated user.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(`${appUrl}/settings?error=no_code`);
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(`${appUrl}/sign-in`);
    }

    // Exchange the OAuth code for an API key via OpenRouter
    const tokenRes = await fetch("https://openrouter.ai/api/v1/auth/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    let apiKey: string;

    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      apiKey = tokenData.key || tokenData.api_key || code;
    } else {
      // Fallback: OpenRouter sometimes returns the key directly in the redirect
      // If the code itself looks like an API key (starts with sk-or-), use it directly
      if (code.startsWith("sk-or-")) {
        apiKey = code;
      } else {
        return NextResponse.redirect(
          `${appUrl}/settings?error=token_exchange_failed`
        );
      }
    }

    // Store the API key in Appwrite
    const { databases } = createAdminClient();

    // Check if user already has an OpenRouter provider record
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.AI_PROVIDERS,
      [
        Query.equal("user_id", userId),
        Query.equal("provider_type", "OPENROUTER"),
      ]
    );

    if (existing.documents.length > 0) {
      // Update existing record
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.AI_PROVIDERS,
        existing.documents[0].$id,
        {
          api_key: apiKey,
          base_url: "https://openrouter.ai/api/v1",
        }
      );
    } else {
      // Create new provider record
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.AI_PROVIDERS,
        "unique()",
        {
          user_id: userId,
          provider_type: "OPENROUTER",
          base_url: "https://openrouter.ai/api/v1",
          api_key: apiKey,
          selected_model: "",
          is_free_tier: true,
          max_rpm: 15,
          max_tpm: 100000,
          max_concurrency: 2,
        }
      );
    }

    return NextResponse.redirect(`${appUrl}/settings?openrouter=connected`);
  } catch (error) {
    console.error("[/api/openrouter/auth] Error:", error);
    return NextResponse.redirect(`${appUrl}/settings?error=internal`);
  }
}
