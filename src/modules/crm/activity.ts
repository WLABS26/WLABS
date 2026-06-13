import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Append an entry to a Lead's activity timeline.
 * Used by inbound forms, agents, and dashboard actions to build a full
 * audit trail per lead.
 */
export async function logActivity(
  leadId: string,
  type: string,
  description: string,
  metadata?: Record<string, unknown>,
) {
  return prisma.activity.create({
    data: {
      leadId,
      type,
      description,
      metadataJson: metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
