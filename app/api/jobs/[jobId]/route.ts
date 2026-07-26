import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const { databases } = createAdminClient();

    const job = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.SAAYA_JOBS,
      jobId
    );

    // Verify ownership
    if (job.user_id !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("[/api/jobs/[jobId]] Error:", error);
    return NextResponse.json(
      { error: "Job not found" },
      { status: 404 }
    );
  }
}
