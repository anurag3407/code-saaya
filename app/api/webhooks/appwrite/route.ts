import { NextRequest, NextResponse } from "next/server";

/**
 * Appwrite Webhook handler for realtime events
 * Receives database change events for job status updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Webhook] Appwrite event:", body?.events?.[0] || "unknown");

    // In production, this would trigger SSE/WebSocket updates to connected clients
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
