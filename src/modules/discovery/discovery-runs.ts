/**
 * Prisma helpers for DiscoveryRun records (Scope Market).
 */
import type { DiscoveryRunStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { IndustryKey } from "@/modules/shared/types";

export interface CreateDiscoveryRunInput {
  workflowRunId: string;
  city: string;
  country?: string;
  industries: IndustryKey[];
  targetCount: number;
  status: DiscoveryRunStatus;
  leadIds: string[];
  placesFound: number;
  imported: number;
  skippedDuplicate: number;
  skippedSuppressed: number;
  createdBy?: string;
  completedAt?: Date;
}

export async function createDiscoveryRun(input: CreateDiscoveryRunInput) {
  return prisma.discoveryRun.create({
    data: {
      workflowRunId: input.workflowRunId,
      city: input.city,
      country: input.country ?? null,
      industries: input.industries,
      targetCount: input.targetCount,
      status: input.status,
      leadIds: input.leadIds,
      placesFound: input.placesFound,
      imported: input.imported,
      skippedDuplicate: input.skippedDuplicate,
      skippedSuppressed: input.skippedSuppressed,
      createdBy: input.createdBy ?? null,
      completedAt: input.completedAt ?? null,
    },
  });
}

export interface UpdateDiscoveryRunInput {
  status?: DiscoveryRunStatus;
  dedicatedSalesCount?: number;
  prospectsCount?: number;
  completedAt?: Date;
}

export async function updateDiscoveryRun(id: string, input: UpdateDiscoveryRunInput) {
  return prisma.discoveryRun.update({ where: { id }, data: input });
}

/** List recent Scope Market discovery runs for the admin discovery page. */
export async function listDiscoveryRuns(limit = 20) {
  return prisma.discoveryRun.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export type DiscoveryRunListItem = Awaited<ReturnType<typeof listDiscoveryRuns>>[number];

/** Count discovery-sourced leads created today (UTC) - drives the daily discovery cap. */
export async function getDiscoveredTodayCount(): Promise<number> {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  return prisma.lead.count({
    where: { source: "google_places_discovery", createdAt: { gte: startOfToday } },
  });
}
