/**
 * Preview generation pipeline: Redesign Brief → Preview content.
 *
 * Loads a lead's latest audit and capture, runs the Redesign Strategy and
 * Preview Generation agents as persisted WorkflowSteps, and writes the
 * RedesignBrief and Preview records. The Preview gets a unique slug and a
 * private token so it can be shared at /preview/[slug]?token=...
 */
import { randomBytes } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/modules/crm/activity";
import { slugify } from "@/lib/utils";

import { previewGenerationAgent } from "./preview-generation-agent";
import { redesignStrategyAgent } from "./redesign-strategy-agent";
import { finishWorkflowRun, runAgentStep, startWorkflowRun } from "./runner";

export interface RunPreviewGenerationResult {
  workflowRunId: string;
  previewId: string;
  slug: string;
  token: string;
  ok: boolean;
}

/** Ensure a Preview.slug is unique (previews and leads share the same base slug). */
async function uniquePreviewSlug(base: string): Promise<string> {
  const root = slugify(base) || "preview";
  let slug = root;
  let n = 1;
  while (await prisma.preview.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

export async function runPreviewGeneration(
  leadId: string,
  options: { createdBy?: string } = {},
): Promise<RunPreviewGenerationResult> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  const audit = await prisma.audit.findFirst({ where: { leadId }, orderBy: { createdAt: "desc" } });
  const capture = await prisma.websiteCapture.findFirst({
    where: { leadId, crawlStatus: "success" },
    orderBy: { createdAt: "desc" },
  });

  const extracted = (capture?.extractedDataJson ?? null) as { addressHints?: string[] } | null;
  const addressHint = extracted?.addressHints?.[0] ?? null;

  const run = await startWorkflowRun({
    workflowType: "preview_pipeline",
    leadId,
    createdBy: options.createdBy ?? "manual",
    metadata: { leadSlug: lead.slug, businessName: lead.businessName },
  });
  const stepCtx = { workflowRunId: run.id, leadId };

  // ---- Step 1: Redesign brief ----
  const brief = await runAgentStep(
    redesignStrategyAgent,
    {
      businessName: lead.businessName,
      industry: lead.industry,
      city: lead.city,
      auditScore: audit?.overallScore ?? null,
      topIssues: (audit?.topIssuesJson as string[] | undefined) ?? [],
      quickWins: (audit?.quickWinsJson as string[] | undefined) ?? [],
      recommendedPositioning: audit?.recommendedPositioning ?? null,
      salesAngle: audit?.salesAngle ?? null,
    },
    stepCtx,
  );

  if (brief.status !== "completed" || !brief.output) {
    await finishWorkflowRun(run.id, "failed");
    throw new Error("Redesign brief generation failed.");
  }

  const b = brief.output;
  await prisma.redesignBrief.create({
    data: {
      leadId,
      industry: lead.industry,
      businessSummary: b.businessSummary,
      targetCustomer: b.targetCustomer,
      currentWeaknessesJson: b.currentWeaknesses,
      redesignOpportunitiesJson: b.redesignOpportunities,
      recommendedHeadline: b.recommendedHeadline,
      recommendedSubheadline: b.recommendedSubheadline,
      suggestedCtasJson: b.suggestedCtas,
      recommendedSectionsJson: b.recommendedSections,
      visualStyleDirection: b.visualStyleDirection,
      credibilityElementsJson: b.credibilityElements,
      localSeoAngle: b.localSeoAngle,
      beforeAfterNarrative: b.beforeAfterNarrative,
      emailPitchAngle: b.emailPitchAngle,
    },
  });

  // ---- Step 2: Preview content ----
  const preview = await runAgentStep(
    previewGenerationAgent,
    {
      businessName: lead.businessName,
      industry: lead.industry,
      city: lead.city,
      contactPhone: lead.contactPhone,
      contactEmail: lead.contactEmail,
      addressHint,
      headline: b.recommendedHeadline,
      subheadline: b.recommendedSubheadline,
    },
    stepCtx,
  );

  if (preview.status !== "completed" || !preview.output) {
    await finishWorkflowRun(run.id, "failed");
    throw new Error("Preview generation failed.");
  }

  const slug = await uniquePreviewSlug(lead.slug);
  const token = randomBytes(16).toString("hex");

  const created = await prisma.preview.create({
    data: {
      leadId,
      slug,
      token,
      status: "generated",
      contentJson: preview.output.content as unknown as Prisma.InputJsonValue,
      themeJson: preview.output.theme as unknown as Prisma.InputJsonValue,
      previewUrl: `/preview/${slug}`,
    },
  });

  await prisma.lead.update({ where: { id: leadId }, data: { status: "preview_generated" } });
  await logActivity(leadId, "preview_generated", "Preview homepage concept generated.", { previewId: created.id, slug });

  await finishWorkflowRun(run.id, "completed");

  return { workflowRunId: run.id, previewId: created.id, slug, token, ok: true };
}
