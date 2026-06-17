/**
 * Social post generation pipeline.
 *
 * Orchestrates: content generation → image generation → DB persistence.
 * Tracked as a WorkflowRun (no lead association — WLABS brand content).
 * Safe to call from a server action or a scheduled job.
 */
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { startWorkflowRun, finishWorkflowRun, runAgentStep } from "@/modules/agents/runner";
import { generateSocialImage } from "./image-agent";
import { socialContentAgent } from "./content-agent";
import type { SocialPlatform, SocialPostType } from "./types";

export interface SocialPostGenerationOptions {
  postTypes?: SocialPostType[];
  platforms?: SocialPlatform[];
  createdBy?: string;
}

export interface SocialPostGenerationResult {
  workflowRunId: string;
  postIds: string[];
  platforms: SocialPlatform[];
}

const DEFAULT_POST_TYPE_ROTATION: SocialPostType[] = ["tip", "stat", "service_promo", "industry_spotlight", "general_brand"];

export async function runSocialPostGeneration(options: SocialPostGenerationOptions = {}): Promise<SocialPostGenerationResult> {
  const platforms: SocialPlatform[] = options.platforms ?? ["instagram", "linkedin"];
  const postTypes = options.postTypes ?? [DEFAULT_POST_TYPE_ROTATION[Math.floor(Date.now() / 86400000) % DEFAULT_POST_TYPE_ROTATION.length]];
  const postType = postTypes[0];

  const run = await startWorkflowRun({
    workflowType: "social_post_generation",
    createdBy: options.createdBy ?? "admin",
    metadata: { postType, platforms },
  });

  const postIds: string[] = [];

  for (const platform of platforms) {
    const stepResult = await runAgentStep(socialContentAgent, { postType, platform }, { workflowRunId: run.id });

    if (stepResult.status !== "completed" || !stepResult.output) continue;

    const content = stepResult.output;
    const imageUrl = await generateSocialImage(content.imageDescription, platform).catch(() => null);

    const post = await prisma.socialPost.create({
      data: {
        platform,
        postType,
        caption: content.caption,
        hashtags: content.hashtags,
        imageUrl: imageUrl ?? undefined,
        imagePrompt: content.imageDescription,
        status: "needs_review",
        workflowRunId: run.id,
      } as Prisma.SocialPostCreateInput,
    });

    postIds.push(post.id);
  }

  await finishWorkflowRun(run.id, postIds.length > 0 ? "completed" : "failed");
  return { workflowRunId: run.id, postIds, platforms };
}
