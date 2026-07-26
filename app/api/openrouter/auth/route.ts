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

  // Determine actual app URL dynamically (prevents fallback to localhost on production)
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  let appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    if (host && !host.includes("localhost")) {
      appUrl = `${proto}://${host}`;
    } else if (process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      appUrl = request.nextUrl.origin || "http://localhost:3000";
    }
  }
  appUrl = appUrl.replace(/\/$/, "");

  if (!code) {
    return NextResponse.redirect(`${appUrl}/settings?error=no_code`);
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(`${appUrl}/sign-in`);
    }

    let apiKey: string | null = null;

    // Fallback: If code itself is already an API key
    if (code.startsWith("sk-or-")) {
      apiKey = code;
    } else {
      // Exchange the OAuth code for an API key via OpenRouter
      // Docs: https://openrouter.ai/docs/guides/overview/auth/oauth
      const tokenRes = await fetch("https://openrouter.ai/api/v1/auth/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        apiKey = tokenData.key || tokenData.api_key || null;
      } else {
        const errText = await tokenRes.text().catch(() => "");
        console.error("[/api/openrouter/auth] OpenRouter token exchange failed:", tokenRes.status, errText);
      }
    }

    if (!apiKey) {
      return NextResponse.redirect(`${appUrl}/settings?error=token_exchange_failed`);
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
