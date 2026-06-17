/**
 * Email drafting pipeline: Draft → QC.
 *
 * Loads a lead's audit and preview, drafts a personalized outreach email,
 * runs it through QC, and persists an EmailDraft. Emails are NEVER sent here -
 * the draft lands in the review queue for human approval and (later) export.
 */
import { Prisma } from "@/generated/prisma/client";
import type { EmailVariant } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/modules/crm/activity";
import { checkSuppression } from "@/modules/lead-source/suppression";
import { industryLabel } from "@/modules/generator/industry-templates";
import { PRICING } from "@/modules/shared/constants";

import { emailDraftingAgent } from "./email-drafting-agent";
import { emailQcAgent } from "./email-qc-agent";
import { finishWorkflowRun, runAgentStep, startWorkflowRun } from "./runner";

export interface RunEmailDraftingResult {
  workflowRunId: string;
  emailDraftId: string;
  qcStatus: "passed" | "needs_review" | "failed";
  status: string;
}

function detectEmailLanguage(country: string | null | undefined): "de" | "en" {
  if (!country) return "en";
  const dach = ["de", "at", "ch", "germany", "austria", "switzerland", "deutschland", "österreich", "schweiz"];
  return dach.some((c) => country.toLowerCase().includes(c)) ? "de" : "en";
}

function senderName(): string {
  const from = process.env.EMAIL_FROM;
  if (from) {
    const match = from.match(/^([^<]+)</);
    if (match) return match[1].trim();
  }
  return "The WLABS Team";
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export async function runEmailDrafting(
  leadId: string,
  variant: EmailVariant = "direct_preview",
  options: { createdBy?: string } = {},
): Promise<RunEmailDraftingResult> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  const language = detectEmailLanguage(lead.country);

  const audit = await prisma.audit.findFirst({ where: { leadId }, orderBy: { createdAt: "desc" } });
  const preview = await prisma.preview.findFirst({ where: { leadId }, orderBy: { createdAt: "desc" } });
  const suppression = await checkSuppression({ email: lead.contactEmail, websiteUrl: lead.websiteUrl });

  const previewUrl =
    preview && preview.token ? `${appUrl()}/preview/${preview.slug}?token=${preview.token}` : preview ? `${appUrl()}/preview/${preview.slug}` : null;

  const run = await startWorkflowRun({
    workflowType: "email_pipeline",
    leadId,
    createdBy: options.createdBy ?? "manual",
    metadata: { leadSlug: lead.slug, businessName: lead.businessName, variant },
  });
  const stepCtx = { workflowRunId: run.id, leadId };

  // ---- Step 1: Draft ----
  const draft = await runAgentStep(
    emailDraftingAgent,
    {
      businessName: lead.businessName,
      contactPerson: lead.contactPerson,
      city: lead.city,
      industryLabel: industryLabel(lead.industry),
      auditScore: audit?.overallScore ?? null,
      topIssues: (audit?.topIssuesJson as string[] | undefined) ?? [],
      bestPracticeComparison: audit?.bestPracticeComparison ?? null,
      benchmarkGap: audit?.benchmarkGap ?? null,
      criticalFindings: (audit?.criticalFindingsJson as string[] | undefined) ?? [],
      previewUrl,
      bookingUrl: process.env.BOOKING_URL ?? null,
      price: PRICING.mvp.price,
      currency: PRICING.mvp.currency,
      senderName: senderName(),
      variant,
      language,
    },
    stepCtx,
  );

  if (draft.status !== "completed" || !draft.output) {
    await finishWorkflowRun(run.id, "failed");
    throw new Error("Email drafting failed.");
  }

  const d = draft.output;
  const emailDraft = await prisma.emailDraft.create({
    data: {
      leadId,
      subject: d.subject,
      body: d.body,
      variant: d.variant,
      status: d.status,
      language: d.language,
      personalizationJson: d.personalizationFields as unknown as Prisma.InputJsonValue,
      complianceFlagsJson: d.complianceFlags as unknown as Prisma.InputJsonValue,
    },
  });

  // ---- Step 2: QC ----
  const qc = await runAgentStep(
    emailQcAgent,
    {
      subject: d.subject,
      body: d.body,
      businessName: lead.businessName,
      hasPreviewLink: Boolean(previewUrl),
      isSuppressed: Boolean(suppression),
      language,
    },
    stepCtx,
  );

  const qcStatus = qc.output?.qcStatus ?? "needs_review";
  const emailStatus = qcStatus === "failed" ? "do_not_send" : qcStatus === "needs_review" ? "needs_review" : "draft";

  await prisma.emailDraft.update({
    where: { id: emailDraft.id },
    data: {
      qcStatus,
      qcIssuesJson: (qc.output?.qcIssues ?? []) as unknown as Prisma.InputJsonValue,
      status: emailStatus,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: qcStatus === "passed" ? "email_qc_passed" : "email_drafted" },
  });
  await logActivity(leadId, "email_drafted", `Email drafted (${variant.replace(/_/g, " ")}) - QC ${qcStatus.replace(/_/g, " ")}.`, {
    emailDraftId: emailDraft.id,
    variant,
    qcStatus,
  });

  await finishWorkflowRun(run.id, "completed");

  return { workflowRunId: run.id, emailDraftId: emailDraft.id, qcStatus, status: emailStatus };
}
