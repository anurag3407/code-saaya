import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/server";
import { getInMemoryJob, updateInMemoryJob, deleteInMemoryJob, pushJobLog } from "@/lib/ai/job-store";
import type { JobStatus } from "@/types/saaya";

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

    // Check in-memory job store first
    const memoryJob = getInMemoryJob(jobId);
    if (memoryJob) {
      if (memoryJob.user_id === userId) {
        return NextResponse.json(memoryJob);
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fallback to Appwrite
    const { databases } = createAdminClient();

    const job = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.SAAYA_JOBS,
      jobId
    );

    if (job.user_id !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("[/api/jobs/[jobId]] GET Error:", error);
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const body = await request.json();
    const action = body.action as "pause" | "resume" | "cancel";

    const memoryJob = getInMemoryJob(jobId);
    if (memoryJob && memoryJob.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let newStatus: JobStatus;
    let logMsg = "";

    if (action === "pause") {
      newStatus = "PAUSED";
      logMsg = "Job generation execution paused by user.";
    } else if (action === "resume") {
      newStatus = memoryJob?.status === "PAUSED" ? "PLANNING" : "SCANNING";
      logMsg = "Job generation execution resumed by user.";
    } else if (action === "cancel") {
      newStatus = "FAILED";
      logMsg = "Job generation cancelled by user.";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update in-memory job
    updateInMemoryJob(jobId, { status: newStatus });
    pushJobLog(jobId, action === "pause" ? "warn" : "info", logMsg);

    // Update Appwrite Database if present
    try {
      const { databases } = createAdminClient();
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SAAYA_JOBS,
        jobId,
        { status: newStatus, current_step: logMsg }
      );
    } catch {
      // Ignore if document not created in Appwrite yet
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("[/api/jobs/[jobId]] PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    // Delete in-memory job
    deleteInMemoryJob(jobId);

    // Delete Appwrite Database document
    try {
      const { databases } = createAdminClient();
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SAAYA_JOBS, jobId);
    } catch {
      // Ignore if not present in Appwrite
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/jobs/[jobId]] DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}
