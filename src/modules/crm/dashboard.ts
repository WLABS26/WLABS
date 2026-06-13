import type { Activity, InboundRequest, LeadStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const ACTIVE_WORKFLOW_STATUSES: ReadonlyArray<"pending" | "running" | "waiting_for_approval" | "paused"> = [
  "pending",
  "running",
  "waiting_for_approval",
  "paused",
];

export interface DashboardStats {
  totalLeads: number;
  leadsByStatus: { status: LeadStatus; count: number }[];
  newInboundRequests: number;
  activeWorkflowRuns: number;
  highOpportunityLeads: number;
  recentActivities: (Activity & { lead: { businessName: string; slug: string } })[];
  recentInboundRequests: InboundRequest[];
}

/** Aggregate stats for the admin dashboard overview page. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalLeads, leadsByStatusRaw, newInboundRequests, activeWorkflowRuns, highOpportunityLeads, recentActivities, recentInboundRequests] =
    await Promise.all([
      prisma.lead.count(),
      prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.inboundRequest.count({ where: { status: "new" } }),
      prisma.workflowRun.count({ where: { status: { in: [...ACTIVE_WORKFLOW_STATUSES] } } }),
      prisma.lead.count({ where: { status: "high_opportunity" } }),
      prisma.activity.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { lead: { select: { businessName: true, slug: true } } },
      }),
      prisma.inboundRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  const leadsByStatus = leadsByStatusRaw.map((group) => ({
    status: group.status,
    count: group._count._all,
  }));

  return {
    totalLeads,
    leadsByStatus,
    newInboundRequests,
    activeWorkflowRuns,
    highOpportunityLeads,
    recentActivities,
    recentInboundRequests,
  };
}
