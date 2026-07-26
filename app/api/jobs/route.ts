import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { databases } = createAdminClient();

    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SAAYA_JOBS,
      [
        Query.equal("user_id", userId),
        Query.orderDesc("created_at"),
        Query.limit(50),
      ]
    );

    return NextResponse.json({ jobs: result.documents });
  } catch (error) {
    console.error("[/api/jobs] Error:", error);
    return NextResponse.json({ jobs: [] });
  }
}
