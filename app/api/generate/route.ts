import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";
import { createAIClient, getRateLimits } from "@/lib/ai/provider";
import { RateLimitedTaskQueue } from "@/lib/ai/rate-limiter";
import { scanRepository, parseGitHubUrl } from "@/lib/ai/scanner";
import { buildPipelineGraph } from "@/lib/ai/pipeline";
import { createSaayaPullRequest } from "@/lib/github/pr-automation";
import type { ProviderType, GeneratedFile } from "@/types/saaya";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      repoUrl,
      providerType = "OPENROUTER",
      model,
      baseUrl,
      apiKey,
      maxRpm,
    } = body as {
      repoUrl: string;
      providerType: ProviderType;
      model: string;
      baseUrl?: string;
      apiKey?: string;
      maxRpm?: number;
    };

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Parse repo URL
    const { owner, repo } = parseGitHubUrl(repoUrl);
    const githubToken = process.env.GITHUB_TOKEN!;
    const jobId = uuidv4();

    // Resolve API key
    const resolvedApiKey =
      providerType === "OPENROUTER"
        ? apiKey || process.env.OPENROUTER_API_KEY || "sk-or-placeholder"
        : apiKey || "not-needed";

    // Create AI client & rate limiter
    const aiClient = createAIClient({
      providerType,
      apiKey: resolvedApiKey,
      baseUrl,
      model,
    });

    const limits = getRateLimits(model, maxRpm);
    const queue = new RateLimitedTaskQueue(
      limits.maxConcurrency,
      limits.maxRpm
    );

    // Start pipeline asynchronously (don't block the response)
    const pipelinePromise = (async () => {
      try {
        // Step 1: Scan repository
        console.log(`[Job ${jobId}] Scanning ${owner}/${repo}...`);
        const { fileTree, configFiles } = await scanRepository(
          githubToken,
          owner,
          repo
        );

        // Step 2: Run LangGraph pipeline
        console.log(`[Job ${jobId}] Starting LangGraph pipeline...`);
        const pipeline = buildPipelineGraph();

        const result = await pipeline.invoke({
          jobId,
          owner,
          repo,
          githubToken,
          model,
          aiClient,
          queue,
          fileTree,
          configFiles,
          taxonomy: [],
          catalogs: [],
          generatedCards: [],
          generatedArticles: [],
          metadata: {},
          pullRequestUrl: undefined,
          error: undefined,
          progress: 10,
          currentStep: "Scanning repository",
          onProgress: (step: string, progress: number) => {
            console.log(`[Job ${jobId}] ${progress}% — ${step}`);
          },
        });

        // Step 3: Collect all generated files
        const allFiles: GeneratedFile[] = [
          ...result.generatedCards,
          ...result.generatedArticles,
        ];

        // Step 4: Create Pull Request
        console.log(`[Job ${jobId}] Creating PR with ${allFiles.length} files...`);
        const prUrl = await createSaayaPullRequest({
          githubToken,
          owner,
          repo,
          saayaFiles: allFiles,
        });

        console.log(`[Job ${jobId}] ✅ Complete! PR: ${prUrl}`);
        return { success: true, prUrl };
      } catch (err) {
        console.error(`[Job ${jobId}] ❌ Failed:`, err);
        return { success: false, error: String(err) };
      }
    })();

    // Don't await — return immediately with jobId
    // In production, this would be tracked via Appwrite realtime
    pipelinePromise.catch(console.error);

    return NextResponse.json({
      jobId,
      status: "PENDING",
      message: `Saaya generation started for ${owner}/${repo}`,
    });
  } catch (error) {
    console.error("[/api/generate] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
