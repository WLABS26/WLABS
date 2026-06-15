/**
 * Single-lead pipeline: Qualify → Crawl → Audit.
 *
 * This is the orchestration layer that turns the pure agents into a persisted,
 * auditable workflow. It loads the lead, resolves database-only facts
 * (suppression), runs each agent as a WorkflowStep, and writes the resulting
 * WebsiteCapture / Audit records and lead status transitions. Batch
 * orchestration (Phase 6) runs this for many leads.
 */
import { Prisma } from "@/generated/prisma/client";
import type { CrawlStatus, LeadStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/modules/crm/activity";
import { checkSuppression } from "@/modules/lead-source/suppression";
import { INDUSTRIES } from "@/modules/shared/constants";
import type { OpportunityLevel } from "@/modules/shared/types";

import { leadQualificationAgent } from "./lead-qualification-agent";
import { finishWorkflowRun, recordSkippedStep, runAgentStep, startWorkflowRun } from "./runner";
import { websiteAuditAgent } from "./website-audit-agent";
import { websiteCrawlAgent } from "./website-crawl-agent";

export type PipelineOutcome = "rejected" | "needs_manual_review" | "crawl_failed" | "audit_failed" | "audited";

export interface RunLeadPipelineResult {
  workflowRunId: string;
  outcome: PipelineOutcome;
  auditScore?: number;
  opportunity?: OpportunityLevel;
}

const VALID_CRAWL_STATUSES = new Set<CrawlStatus>(["pending", "success", "failed", "blocked", "timeout", "invalid_url"]);

function toCrawlStatus(code: string | undefined): CrawlStatus {
  return code && VALID_CRAWL_STATUSES.has(code as CrawlStatus) ? (code as CrawlStatus) : "failed";
}

function industryLabelFor(value: string): string {
  return INDUSTRIES.find((industry) => industry.value === value)?.label ?? "local business";
}

function opportunityToLeadStatus(level: OpportunityLevel): LeadStatus {
  switch (level) {
    case "high_opportunity":
      return "high_opportunity";
    case "medium_opportunity":
      return "medium_opportunity";
    case "low_opportunity":
      return "low_opportunity";
    default:
      return "rejected";
  }
}

/**
 * Run the qualify→crawl→audit pipeline for a single lead. Persists a
 * WorkflowRun with one step per agent, updates the lead, and creates the
 * WebsiteCapture and Audit records. Safe to call from a server action or a
 * batch orchestrator.
 */
export async function runLeadPipeline(leadId: string, options: { createdBy?: string } = {}): Promise<RunLeadPipelineResult> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  const run = await startWorkflowRun({
    workflowType: "lead_pipeline",
    leadId,
    createdBy: options.createdBy ?? "manual",
    metadata: { leadSlug: lead.slug, businessName: lead.businessName },
  });
  const stepCtx = { workflowRunId: run.id, leadId };

  // ---- Step 1: Qualification ----
  const suppression = await checkSuppression({ email: lead.contactEmail, websiteUrl: lead.websiteUrl });
  const qual = await runAgentStep(
    leadQualificationAgent,
    {
      businessName: lead.businessName,
      industry: lead.industry,
      websiteUrl: lead.websiteUrl,
      contactEmail: lead.contactEmail,
      contactPhone: lead.contactPhone,
      doNotContact: lead.doNotContact,
      isSuppressed: Boolean(suppression),
      isDuplicate: false,
    },
    stepCtx,
  );

  if (qual.status !== "completed" || !qual.output) {
    await recordSkippedStep(websiteCrawlAgent.name, stepCtx);
    await recordSkippedStep(websiteAuditAgent.name, stepCtx);
    await finishWorkflowRun(run.id, "failed");
    return { workflowRunId: run.id, outcome: "audit_failed" };
  }

  const qualStatus = qual.output.qualificationStatus;
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      qualificationStatus: qualStatus,
      status: qualStatus === "rejected" ? "rejected" : qualStatus === "ready_for_crawl" ? "qualified" : lead.status,
    },
  });
  await logActivity(leadId, "lead_qualified", `Qualification: ${qualStatus.replace(/_/g, " ")}.`, {
    reasons: qual.output.reasons,
  });

  if (qualStatus !== "ready_for_crawl") {
    await recordSkippedStep(websiteCrawlAgent.name, stepCtx);
    await recordSkippedStep(websiteAuditAgent.name, stepCtx);
    await finishWorkflowRun(run.id, "completed");
    return {
      workflowRunId: run.id,
      outcome: qualStatus === "rejected" ? "rejected" : "needs_manual_review",
    };
  }

  // ---- Step 2: Crawl ----
  const crawl = await runAgentStep(websiteCrawlAgent, { websiteUrl: lead.websiteUrl ?? "" }, stepCtx);
  const crawlOk = crawl.status === "completed" && crawl.output?.crawlStatus === "success" && crawl.output.extractedData;

  if (!crawlOk || !crawl.output?.extractedData) {
    const crawlStatus = toCrawlStatus(crawl.error?.code);
    await prisma.websiteCapture.create({
      data: { leadId, crawlStatus, errorMessage: crawl.error?.message ?? "Crawl failed." },
    });
    await logActivity(leadId, "crawl_failed", crawl.error?.message ?? "Crawl failed.", { crawlStatus });
    await recordSkippedStep(websiteAuditAgent.name, stepCtx);
    await finishWorkflowRun(run.id, "failed");
    return { workflowRunId: run.id, outcome: "crawl_failed" };
  }

  const data = crawl.output.extractedData;
  await prisma.websiteCapture.create({
    data: {
      leadId,
      crawlStatus: "success",
      title: data.title,
      metaDescription: data.metaDescription,
      h1: data.h1,
      extractedText: data.textSnippets.join("\n\n").slice(0, 5000) || null,
      extractedDataJson: data as unknown as Prisma.InputJsonValue,
    },
  });
  // Backfill missing contact details from the crawl (homepage and/or
  // Impressum page) - discovery-sourced leads in particular often arrive
  // with no email, since Google Places never returns one.
  const leadUpdate: Prisma.LeadUpdateInput = { status: "crawled" };
  const enrichedFields: Record<string, string> = {};

  if (!lead.contactEmail && data.emails[0]) {
    leadUpdate.contactEmail = data.emails[0];
    enrichedFields.contactEmail = data.emails[0];
  }
  if (!lead.contactPhone && data.phones[0]) {
    leadUpdate.contactPhone = data.phones[0];
    enrichedFields.contactPhone = data.phones[0];
  }
  if (!lead.contactPerson && data.contactPerson) {
    leadUpdate.contactPerson = data.contactPerson;
    enrichedFields.contactPerson = data.contactPerson;
  }

  await prisma.lead.update({ where: { id: leadId }, data: leadUpdate });
  await logActivity(leadId, "crawl_completed", `Crawled ${crawl.output.finalUrl}.`);

  if (Object.keys(enrichedFields).length > 0) {
    await logActivity(
      leadId,
      "contact_enriched",
      `Found contact details via crawl${data.imprintUrl ? " (Impressum)" : ""} and added them to the lead.`,
      enrichedFields,
    );
  }

  // ---- Step 3: Audit ----
  const audit = await runAgentStep(
    websiteAuditAgent,
    {
      businessName: lead.businessName,
      industryLabel: industryLabelFor(lead.industry),
      city: lead.city,
      hasContact: Boolean(lead.contactEmail || lead.contactPhone),
      extractedData: data,
    },
    stepCtx,
  );

  if (audit.status !== "completed" || !audit.output) {
    await finishWorkflowRun(run.id, "failed");
    return { workflowRunId: run.id, outcome: "audit_failed" };
  }

  const a = audit.output;
  await prisma.audit.create({
    data: {
      leadId,
      overallScore: a.overallScore,
      categoryScoresJson: a.categoryScores,
      topIssuesJson: a.topIssues,
      quickWinsJson: a.quickWins,
      recommendedPositioning: a.recommendedPositioning,
      salesAngle: a.salesAngle,
      urgencyReason: a.urgencyReason,
      redesignPotential: a.redesignPotential,
      criticalFindingsJson: a.criticalFindings,
      bestPracticeComparison: a.bestPracticeComparison,
      benchmarkGap: a.benchmarkGap,
      qualificationStatus: a.qualificationStatus,
    },
  });
  await prisma.lead.update({
    where: { id: leadId },
    data: { auditScore: a.overallScore, status: opportunityToLeadStatus(a.qualificationStatus) },
  });
  await logActivity(leadId, "audit_completed", `Audit scored ${a.overallScore}/100 - ${a.qualificationStatus.replace(/_/g, " ")}.`, {
    overallScore: a.overallScore,
    qualificationStatus: a.qualificationStatus,
  });

  await finishWorkflowRun(run.id, "completed");
  return {
    workflowRunId: run.id,
    outcome: "audited",
    auditScore: a.overallScore,
    opportunity: a.qualificationStatus,
  };
}
