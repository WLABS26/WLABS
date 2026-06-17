/**
 * Preview generation pipeline: Redesign Brief → Preview content.
 *
 * Loads a lead's latest audit and capture, runs the Redesign Strategy and
 * Preview Generation agents as persisted WorkflowSteps, and writes the
 * RedesignBrief and Preview records. The Preview gets a unique slug and a
 * private token so it can be shared at /preview/[slug]?token=...
 */
import { randomBytes } from "node:crypto";
import { after } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/modules/crm/activity";
import { slugify } from "@/lib/utils";

import type { PreviewContent } from "@/modules/generator/preview-types";
import { sourcePreviewImages } from "@/modules/generator/image-sourcing";
import { resolveWireframeImages } from "@/modules/generator/stock-images";
import { industryLabel } from "@/modules/generator/industry-templates";

import { previewGenerationAgent } from "./preview-generation-agent";
import { previewQcAgent } from "./preview-qc-agent";
import { redesignStrategyAgent } from "./redesign-strategy-agent";
import { wireframeGenerationAgent } from "./wireframe-generation-agent";
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
  const intake = await prisma.intakeSubmission.findFirst({ where: { leadId }, orderBy: { createdAt: "desc" } });

  const extracted = (capture?.extractedDataJson ?? null) as { addressHints?: string[]; brandColors?: string[]; fontFamily?: string | null; imageUrls?: string[] } | null;
  const addressHint = extracted?.addressHints?.[0] ?? null;
  const intakeBrandColorsRaw = intake?.brandColorsJson;
  const intakeBrandColors = Array.isArray(intakeBrandColorsRaw) && intakeBrandColorsRaw.length > 0 ? (intakeBrandColorsRaw as string[]) : null;
  const brandColors = intakeBrandColors ?? extracted?.brandColors ?? [];
  const fontFamily = extracted?.fontFamily ?? null;

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
  const targetCustomer = intake?.targetCustomer?.trim() || b.targetCustomer;
  await prisma.redesignBrief.create({
    data: {
      leadId,
      industry: lead.industry,
      businessSummary: b.businessSummary,
      targetCustomer,
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
      brandColors,
      fontFamily,
    },
    stepCtx,
  );

  if (preview.status !== "completed" || !preview.output) {
    await finishWorkflowRun(run.id, "failed");
    throw new Error("Preview generation failed.");
  }

  // ---- Step 3: Source images (scraped + DALL-E fills) ----
  const images = await sourcePreviewImages(
    extracted?.imageUrls ?? [],
    lead.industry,
    lead.businessName,
  );

  const richContent: PreviewContent = {
    ...preview.output.content,
    hero: {
      ...preview.output.content.hero,
      ...(images.heroImageUrl ? { heroImageUrl: images.heroImageUrl } : {}),
    },
    services: {
      ...preview.output.content.services,
      items: preview.output.content.services.items.map((item, i) => ({
        ...item,
        ...(i === 0 && images.serviceImages.get("__first__") ? { imageUrl: images.serviceImages.get("__first__") } : {}),
      })),
    },
    ...(images.galleryImages.length >= 3 ? { gallery: { images: images.galleryImages } } : {}),
  };

  const slug = await uniquePreviewSlug(lead.slug);
  const token = randomBytes(16).toString("hex");

  const created = await prisma.preview.create({
    data: {
      leadId,
      slug,
      token,
      status: "generated",
      contentJson: richContent as unknown as Prisma.InputJsonValue,
      themeJson: preview.output.theme as unknown as Prisma.InputJsonValue,
      previewUrl: `/preview/${slug}`,
    },
  });

  await prisma.lead.update({ where: { id: leadId }, data: { status: "preview_generated" } });
  await logActivity(leadId, "preview_generated", "Preview homepage concept generated.", { previewId: created.id, slug });

  await finishWorkflowRun(run.id, "completed");

  // Generate interactive wireframe in background (uses Opus, may take 30–60 s).
  // Resolve images: prospect-scraped + DALL-E first, industry stock fills the rest.
  const wireframeScrapedImages = [
    ...(images.heroImageUrl ? [images.heroImageUrl] : []),
    ...images.galleryImages.map((g) => g.url),
    ...(extracted?.imageUrls ?? []),
  ];
  const wireframeImages = resolveWireframeImages(wireframeScrapedImages, lead.industry);

  const wireframeInput = {
    businessName: lead.businessName,
    industry: lead.industry,
    industryLabel: industryLabel(lead.industry),
    city: lead.city ?? null,
    country: lead.country ?? null,
    contactPhone: lead.contactPhone ?? null,
    contactEmail: lead.contactEmail ?? null,
    websiteUrl: lead.websiteUrl ?? null,
    auditScore: audit?.overallScore ?? null,
    topIssues: (audit?.topIssuesJson as string[] | undefined) ?? [],
    criticalFindings: (audit?.criticalFindingsJson as string[] | undefined) ?? [],
    extractedTitle: capture?.title ?? null,
    extractedH1: capture?.h1 ?? null,
    extractedMetaDescription: capture?.metaDescription ?? null,
    extractedText: capture?.extractedText ? capture.extractedText.slice(0, 3000) : null,
    heroImageUrl: wireframeImages.heroImageUrl,
    philosophyImageUrl: wireframeImages.philosophyImageUrl,
    galleryImages: wireframeImages.galleryImages,
    brandColors: extracted?.brandColors ?? [],
    addressHint: extracted?.addressHints?.[0] ?? null,
    language: (["de", "at", "ch", "germany", "austria", "switzerland", "deutschland", "österreich", "schweiz"].some(
      (c) => (lead.country ?? "").toLowerCase().includes(c),
    )
      ? "de"
      : "en") as "de" | "en",
  };

  const previewId = created.id;
  after(async () => {
    try {
      const result = await wireframeGenerationAgent.run(wireframeInput, { leadId });
      if (result.status === "completed" && result.output?.wireframeHtml) {
        await prisma.preview.update({
          where: { id: previewId },
          data: { wireframeHtml: result.output.wireframeHtml },
        });
        await logActivity(leadId, "wireframe_generated", "Interactive wireframe generated successfully.", { previewId });
      }
    } catch (err) {
      console.error("[preview-pipeline] wireframe generation failed:", err);
    }
  });

  return { workflowRunId: run.id, previewId: created.id, slug, token, ok: true };
}

export interface RunPreviewQcResult {
  workflowRunId: string;
  qcStatus: "passed" | "needs_review" | "failed";
}

/** Run the Preview QC Agent against a generated preview and record the result. */
export async function runPreviewQc(previewId: string, options: { createdBy?: string } = {}): Promise<RunPreviewQcResult> {
  const preview = await prisma.preview.findUnique({ where: { id: previewId }, include: { lead: true } });
  if (!preview) throw new Error(`Preview not found: ${previewId}`);

  const content = preview.contentJson as unknown as PreviewContent;

  const run = await startWorkflowRun({
    workflowType: "preview_qc",
    leadId: preview.leadId,
    createdBy: options.createdBy ?? "manual",
    metadata: { previewId, slug: preview.slug },
  });

  const qc = await runAgentStep(
    previewQcAgent,
    {
      expectedBusinessName: preview.lead.businessName,
      expectedIndustry: preview.lead.industry,
      headline: content.hero.headline,
      ctaLabel: content.hero.primaryCta.label,
      servicesCount: content.services.items.length,
      trustNote: content.trust.note,
      trustItems: content.trust.items,
      metaBusinessName: content.meta.businessName,
      metaIndustry: content.meta.industry,
      city: content.meta.city,
    },
    { workflowRunId: run.id, leadId: preview.leadId },
  );

  const qcStatus = qc.output?.qcStatus ?? "needs_review";

  await prisma.preview.update({
    where: { id: previewId },
    data: {
      qcStatus,
      qcIssuesJson: (qc.output?.qcIssues ?? []) as unknown as Prisma.InputJsonValue,
      status: qcStatus === "passed" ? "generated" : "needs_review",
    },
  });

  await prisma.lead.update({
    where: { id: preview.leadId },
    data: { status: qcStatus === "passed" ? "preview_qc_passed" : "preview_needs_review" },
  });

  await logActivity(preview.leadId, "preview_qc", `Preview QC ${qcStatus.replace(/_/g, " ")}.`, { previewId, qcStatus });

  await finishWorkflowRun(run.id, "completed");
  return { workflowRunId: run.id, qcStatus };
}
