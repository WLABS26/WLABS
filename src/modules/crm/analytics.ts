/**
 * Analytics Agent (read model).
 *
 * Computes the WLABS funnel and performance metrics from the database for the
 * admin analytics page: volume, agent success rates, engagement, and the
 * estimated revenue pipeline.
 */
import { prisma } from "@/lib/prisma";
import { PRICING } from "@/modules/shared/constants";

function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export interface AnalyticsSummary {
  totalLeads: number;
  qualifiedLeads: number;
  crawlSuccessRate: number;
  auditCompletionRate: number;
  previewGenerationRate: number;
  previewQcPassRate: number;
  emailDraftRate: number;
  emailApprovalRate: number;
  previewViews: number;
  ctaClicks: number;
  contacted: number;
  replied: number;
  bookedCalls: number;
  won: number;
  lost: number;
  revenue: number;
  pipelineValue: number;
  conversionRate: number;
  currency: string;
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const [
    totalLeads,
    qualifiedLeads,
    captureTotal,
    captureSuccess,
    auditedLeads,
    previewsTotal,
    previewsQcTotal,
    previewsQcPassed,
    emailsTotal,
    emailsApproved,
    previewAgg,
    contacted,
    replied,
    bookedCalls,
    won,
    lost,
    approvedOrLater,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { qualificationStatus: "ready_for_crawl" } }),
    prisma.websiteCapture.count(),
    prisma.websiteCapture.count({ where: { crawlStatus: "success" } }),
    prisma.lead.count({ where: { auditScore: { not: null } } }),
    prisma.preview.count(),
    prisma.preview.count({ where: { qcStatus: { not: null } } }),
    prisma.preview.count({ where: { qcStatus: "passed" } }),
    prisma.emailDraft.count(),
    prisma.emailDraft.count({ where: { status: { in: ["approved", "exported", "sent"] } } }),
    prisma.preview.aggregate({ _sum: { viewCount: true, ctaClickCount: true } }),
    prisma.lead.count({ where: { status: "contacted" } }),
    prisma.lead.count({ where: { status: "replied" } }),
    prisma.lead.count({ where: { status: "booked_call" } }),
    prisma.lead.count({ where: { status: "won" } }),
    prisma.lead.count({ where: { status: "lost" } }),
    prisma.lead.count({ where: { status: { in: ["approved", "contacted", "replied", "booked_call"] } } }),
  ]);

  const price = PRICING.mvp.price;

  return {
    totalLeads,
    qualifiedLeads,
    crawlSuccessRate: rate(captureSuccess, captureTotal),
    auditCompletionRate: rate(auditedLeads, qualifiedLeads),
    previewGenerationRate: rate(previewsTotal, auditedLeads),
    previewQcPassRate: rate(previewsQcPassed, previewsQcTotal),
    emailDraftRate: rate(emailsTotal, previewsTotal),
    emailApprovalRate: rate(emailsApproved, emailsTotal),
    previewViews: previewAgg._sum.viewCount ?? 0,
    ctaClicks: previewAgg._sum.ctaClickCount ?? 0,
    contacted,
    replied,
    bookedCalls,
    won,
    lost,
    revenue: won * price,
    pipelineValue: approvedOrLater * price,
    conversionRate: rate(won, contacted + won + lost),
    currency: PRICING.mvp.currency,
  };
}
