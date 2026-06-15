/**
 * Review queue aggregation for the admin dashboard.
 *
 * Surfaces everything that needs a human: previews and emails awaiting review,
 * failed agent steps, compliance-flagged emails, and high-opportunity leads
 * ready to action.
 */
import { prisma } from "@/lib/prisma";

export async function getReviewQueue() {
  const [previewsNeedingReview, emailsNeedingReview, failedSteps, highOpportunityLeads, dedicatedSalesLeads, doNotSendEmails] =
    await Promise.all([
      prisma.preview.findMany({
        where: { OR: [{ status: "needs_review" }, { qcStatus: "needs_review" }, { qcStatus: "failed" }] },
        orderBy: { createdAt: "desc" },
        include: { lead: { select: { businessName: true, slug: true } } },
      }),
      prisma.emailDraft.findMany({
        where: { status: "needs_review" },
        orderBy: { createdAt: "desc" },
        include: { lead: { select: { businessName: true, slug: true } } },
      }),
      prisma.workflowStep.findMany({
        where: { status: "failed" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { lead: { select: { businessName: true, slug: true } } },
      }),
      prisma.lead.findMany({
        where: { status: "high_opportunity" },
        orderBy: { auditScore: "asc" },
        take: 20,
      }),
      prisma.lead.findMany({
        where: { status: "dedicated_sales" },
        orderBy: { auditScore: "desc" },
        take: 20,
      }),
      prisma.emailDraft.findMany({
        where: { status: "do_not_send" },
        orderBy: { createdAt: "desc" },
        include: { lead: { select: { businessName: true, slug: true } } },
      }),
    ]);

  return {
    previewsNeedingReview,
    emailsNeedingReview,
    failedSteps,
    highOpportunityLeads,
    dedicatedSalesLeads,
    doNotSendEmails,
    totals: {
      previews: previewsNeedingReview.length,
      emails: emailsNeedingReview.length,
      failed: failedSteps.length,
      highOpportunity: highOpportunityLeads.length,
      dedicatedSales: dedicatedSalesLeads.length,
      compliance: doNotSendEmails.length,
    },
  };
}

export type ReviewQueue = Awaited<ReturnType<typeof getReviewQueue>>;

/** List email drafts for the admin emails page, optionally filtered by status. */
export async function listEmailDrafts(status?: string) {
  return prisma.emailDraft.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    include: { lead: { select: { businessName: true, slug: true, contactEmail: true } } },
  });
}

export type EmailDraftListItem = Awaited<ReturnType<typeof listEmailDrafts>>[number];
