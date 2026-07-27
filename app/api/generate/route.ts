import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";
import { createAIClient, getRateLimits } from "@/lib/ai/provider";
import { RateLimitedTaskQueue } from "@/lib/ai/rate-limiter";
import { scanRepository, parseGitHubUrl } from "@/lib/ai/scanner";
import { buildPipelineGraph } from "@/lib/ai/pipeline";
import { createSaayaPullRequest } from "@/lib/github/pr-automation";
import { createAdminClient, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";
import { setInMemoryJob, updateInMemoryJob, pushJobLog, getInMemoryJob } from "@/lib/ai/job-store";
import type { ProviderType, GeneratedFile } from "@/types/saaya";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      repoUrl: inputRepoUrl,
      resumeJobId,
      providerType = "OPENROUTER",
      model,
      baseUrl,
      apiKey,
      maxRpm,
    } = body as {
      repoUrl?: string;
      resumeJobId?: string;
      providerType: ProviderType;
      model: string;
      baseUrl?: string;
      apiKey?: string;
      maxRpm?: number;
    };

    let repoUrl = inputRepoUrl || "";
    let jobId = resumeJobId || uuidv4();
    let existingCheckpoint: any = {};

    if (resumeJobId) {
      let existingJob = getInMemoryJob(resumeJobId);
      if (!existingJob) {
        try {
          const { databases } = createAdminClient();
          const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.SAAYA_JOBS, resumeJobId);
          existingJob = doc as unknown as any;
        } catch {
          // ignore
        }
      }
      if (existingJob) {
        repoUrl = existingJob.repo_url;
        let cpRaw = existingJob.checkpoint || {};
        if (typeof cpRaw === "string") {
          try {
            cpRaw = JSON.parse(cpRaw);
          } catch {
            cpRaw = {};
          }
        }
        existingCheckpoint = cpRaw;
        updateInMemoryJob(resumeJobId, {
          ...existingJob,
          checkpoint: existingCheckpoint,
          status: "PLANNING",
          progress_percentage: existingJob.progress_percentage || 15,
          current_step: "RESUMING",
          error_message: undefined,
        });
        const cachedCardsCount = existingCheckpoint.generatedCards?.length || 0;
        const cachedArticlesCount = existingCheckpoint.generatedArticles?.length || 0;
        pushJobLog(
          resumeJobId,
          "info",
          `▶️ Resuming job ${resumeJobId} (${cachedCardsCount} cards, ${cachedArticlesCount} articles cached in checkpoint)...`
        );
      }
    }

    const targetModel = model?.trim() || "meta-llama/llama-3.3-70b-instruct:free";

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Parse repo URL
    const { owner, repo } = parseGitHubUrl(repoUrl);

    // Use the platform GitHub token from env (handles fork + PR on any repo)
    const githubToken = process.env.GITHUB_TOKEN?.trim() || "";
    if (!githubToken) {
      return NextResponse.json(
        { error: "GITHUB_TOKEN is not configured. Add it to your environment variables." },
        { status: 400 }
      );
    }

    if (!resumeJobId) {
      // Create initial job record
      const initialJob = {
        $id: jobId,
        user_id: userId,
        repo_url: repoUrl,
        repo_name: `${owner}/${repo}`,
        status: "SCANNING" as const,
        progress_percentage: 10,
        current_step: "SCANNING",
        tokens_used: 0,
        created_at: new Date().toISOString(),
      };

      setInMemoryJob(initialJob);

      try {
        const { databases } = createAdminClient();
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.SAAYA_JOBS,
          jobId,
          {
            user_id: userId,
            repo_url: repoUrl,
            repo_name: `${owner}/${repo}`,
            status: "SCANNING",
            progress_percentage: 10,
            current_step: "SCANNING",
            selected_model: targetModel,
            provider_type: providerType,
          }
        );
      } catch (err) {
        console.error("[Appwrite] Error creating job document:", err);
      }
    }

    // Resolve API key (try request body -> Appwrite stored settings -> env var)
    let resolvedApiKey = apiKey?.trim();

    if (!resolvedApiKey && providerType === "OPENROUTER") {
      try {
        const { databases } = createAdminClient();
        const providers = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.AI_PROVIDERS,
          [
            Query.equal("user_id", userId),
            Query.equal("provider_type", "OPENROUTER"),
          ]
        );
        if (providers.documents.length > 0 && providers.documents[0].api_key) {
          resolvedApiKey = providers.documents[0].api_key.trim();
        }
      } catch {
        // Ignore if Appwrite missing
      }
    }

    if (!resolvedApiKey) {
      resolvedApiKey = process.env.OPENROUTER_API_KEY?.trim();
    }

    if (!resolvedApiKey || resolvedApiKey === "sk-or-placeholder") {
      return NextResponse.json(
        {
          error:
            "OpenRouter API Key is missing. Please connect OpenRouter OAuth or enter your API key in Settings.",
        },
        { status: 400 }
      );
    }

    // Create AI client & rate limiter
    const aiClient = createAIClient({
      providerType,
      apiKey: resolvedApiKey,
      baseUrl,
      model: targetModel,
    });

    const limits = getRateLimits(targetModel, maxRpm);
    const queue = new RateLimitedTaskQueue(
      limits.maxConcurrency,
      limits.maxRpm
    );

    // Start pipeline asynchronously (don't block the response)
    const pipelinePromise = (async () => {
      try {
        // Step 1: Scan repository (or reuse cached scan if resuming)
        let fileTree = existingCheckpoint.fileTree || [];
        let configFiles = existingCheckpoint.configFiles || {};

        if (!fileTree.length) {
          pushJobLog(jobId, "info", `Scanning repository ${owner}/${repo}...`);
          const scanRes = await scanRepository(githubToken, owner, repo);
          fileTree = scanRes.fileTree;
          configFiles = scanRes.configFiles;
          pushJobLog(jobId, "success", `Found ${fileTree.length} files, ${Object.keys(configFiles).length} config files`);
        } else {
          pushJobLog(jobId, "info", `Reusing scanned file tree (${fileTree.length} files) from checkpoint`);
        }

        updateInMemoryJob(jobId, { status: "PLANNING", progress_percentage: 15, current_step: "PLANNING" });

        // Step 2: Run LangGraph pipeline
        pushJobLog(jobId, "info", `Starting AI pipeline with model: ${targetModel}`);
        pushJobLog(jobId, "info", `Rate limits: ${limits.maxConcurrency} concurrent, ${limits.maxRpm} RPM`);
        const pipeline = buildPipelineGraph();

        const result = await pipeline.invoke({
          jobId,
          owner,
          repo,
          githubToken,
          model: targetModel,
          aiClient,
          queue,
          fileTree,
          configFiles,
          taxonomy: existingCheckpoint.taxonomy || [],
          catalogs: existingCheckpoint.catalogs || [],
          generatedCards: existingCheckpoint.generatedCards || [],
          generatedArticles: existingCheckpoint.generatedArticles || [],
          metadata: {},
          pullRequestUrl: undefined,
          error: undefined,
          progress: 15,
          currentStep: "PLANNING",
          onProgress: (step: string, progress: number) => {
            pushJobLog(jobId, "info", `[${progress}%] ${step}`);
            const status =
              progress >= 90
                ? "CREATING_PR"
                : progress > 65
                ? "WRITING_ARTICLES"
                : progress > 35
                ? "GENERATING_CARDS"
                : "PLANNING";
            updateInMemoryJob(jobId, {
              status,
              progress_percentage: progress,
              current_step: step,
            });
            try {
              const { databases } = createAdminClient();
              databases.updateDocument(DATABASE_ID, COLLECTIONS.SAAYA_JOBS, jobId, {
                status,
                progress_percentage: progress,
                current_step: step,
              }).catch(() => {});
            } catch {}
          },
          onCheckpoint: (cp: Record<string, any>) => {
            const currentJob = getInMemoryJob(jobId);
            const mergedCheckpoint = {
              ...(currentJob?.checkpoint || {}),
              ...cp,
            };
            updateInMemoryJob(jobId, { checkpoint: mergedCheckpoint });
            try {
              const { databases } = createAdminClient();
              databases.updateDocument(DATABASE_ID, COLLECTIONS.SAAYA_JOBS, jobId, {
                checkpoint: JSON.stringify(mergedCheckpoint),
              }).catch(() => {});
            } catch {}
          },
        });

        // Save progress checkpoint
        updateInMemoryJob(jobId, {
          checkpoint: {
            fileTree,
            configFiles,
            taxonomy: result.taxonomy,
            catalogs: result.catalogs,
            generatedCards: result.generatedCards,
            generatedArticles: result.generatedArticles,
          },
        });

        // Step 3: Collect all generated files
        const allFiles: GeneratedFile[] = [
          ...result.generatedCards,
          ...result.generatedArticles,
        ];
        pushJobLog(jobId, "success", `Generated ${allFiles.length} documentation files`);

        updateInMemoryJob(jobId, { status: "CREATING_PR", progress_percentage: 92, current_step: "CREATING_PR" });

        // Step 4: Create Pull Request
        pushJobLog(jobId, "info", `Creating pull request with ${allFiles.length} files...`);
        const prUrl = await createSaayaPullRequest({
          githubToken,
          owner,
          repo,
          saayaFiles: allFiles,
          onLog: (msg) => pushJobLog(jobId, "info", msg),
        });

        pushJobLog(jobId, "success", `✅ Done! PR created: ${prUrl}`);

        updateInMemoryJob(jobId, {
          status: "COMPLETED",
          progress_percentage: 100,
          current_step: "COMPLETED",
          pull_request_url: prUrl,
        });

        try {
          const { databases } = createAdminClient();
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.SAAYA_JOBS,
            jobId,
            {
              status: "COMPLETED",
              progress_percentage: 100,
              current_step: "COMPLETED",
              pull_request_url: prUrl,
            }
          );
        } catch {
          // ignore
        }

        return { success: true, prUrl };
      } catch (err) {
        console.error(`[Job ${jobId}] ❌ Failed:`, err);
        pushJobLog(jobId, "error", `Pipeline failed: ${err instanceof Error ? err.message : String(err)}`);
        updateInMemoryJob(jobId, {
          status: "FAILED",
          error_message: String(err),
        });
        try {
          const { databases } = createAdminClient();
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.SAAYA_JOBS,
            jobId,
            {
              status: "FAILED",
              error_message: String(err),
            }
          );
        } catch {
          // ignore
        }
        return { success: false, error: String(err) };
      }
    })();

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
