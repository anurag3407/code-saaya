import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";
import { listInMemoryUserJobs } from "@/lib/ai/job-store";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memoryJobs = listInMemoryUserJobs(userId);

    try {
      const { databases } = createAdminClient();
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SAAYA_JOBS,
        [
          Query.equal("user_id", userId),
          Query.orderDesc("$createdAt"),
          Query.limit(50),
        ]
      );

      // Combine and deduplicate
      const appwriteJobs = result.documents || [];
      const memoryIds = new Set(memoryJobs.map((j) => j.$id));
      const filteredAppwrite = appwriteJobs.filter((j) => !memoryIds.has(j.$id));
      const combined = [...memoryJobs, ...filteredAppwrite];

      return NextResponse.json({ jobs: combined });
    } catch {
      return NextResponse.json({ jobs: memoryJobs });
    }
  } catch (error) {
    console.error("[/api/jobs] Error:", error);
    return NextResponse.json({ jobs: [] });
  }
}
