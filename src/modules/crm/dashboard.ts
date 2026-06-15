import type { Activity, InboundRequest, LeadStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { FUNNEL_STAGES } from "@/modules/shared/types";

const ACTIVE_WORKFLOW_STATUSES: ReadonlyArray<"pending" | "running" | "waiting_for_approval" | "paused"> = [
  "pending",
  "running",
  "waiting_for_approval",
  "paused",
];

export interface FunnelStageCount {
  key: string;
  label: string;
  statuses: readonly LeadStatus[];
  count: number;
}

export interface DashboardStats {
  totalLeads: number;
  leadsByStatus: { status: LeadStatus; count: number }[];
  funnel: FunnelStageCount[];
  rejectedLeads: number;
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

  const funnel: FunnelStageCount[] = FUNNEL_STAGES.map((stage) => ({
    key: stage.key,
    label: stage.label,
    statuses: stage.statuses,
    count: leadsByStatus
      .filter((group) => (stage.statuses as readonly LeadStatus[]).includes(group.status))
      .reduce((sum, group) => sum + group.count, 0),
  }));

  const rejectedLeads = leadsByStatus.find((group) => group.status === "rejected")?.count ?? 0;

  return {
    totalLeads,
    leadsByStatus,
    funnel,
    rejectedLeads,
    newInboundRequests,
    activeWorkflowRuns,
    highOpportunityLeads,
    recentActivities,
    recentInboundRequests,
  };
}
