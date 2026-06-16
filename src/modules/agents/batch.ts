/**
 * Batch Orchestration Agent.
 *
 * Runs a WLABS operation across a controlled batch of leads: selects eligible
 * leads by status, processes them sequentially with a rate-limit delay, logs
 * every result, and returns a summary. Each lead's work is itself a persisted
 * WorkflowRun, so progress stays visible in the dashboard.
 */
import type { LeadStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { runEmailDrafting } from "./email-pipeline";
import { runLeadPipeline } from "./lead-pipeline";
import { runPreviewGeneration, runPreviewQc } from "./preview-pipeline";

export type BatchOperation = "full_pipeline" | "preview" | "email";

export interface BatchOptions {
  operation: BatchOperation;
  batchSize?: number;
  createdBy?: string;
  delayMs?: number;
}

export interface BatchRowResult {
  leadId: string;
  businessName: string;
  ok: boolean;
  detail: string;
}

export interface BatchResult {
  operation: BatchOperation;
  batchSize: number;
  processed: number;
  succeeded: number;
  failed: number;
  results: BatchRowResult[];
}

const DEFAULT_STATUSES: Record<BatchOperation, LeadStatus[]> = {
  full_pipeline: ["imported", "qualified"],
  preview: ["audited", "high_opportunity", "medium_opportunity"],
  email: ["preview_generated", "preview_qc_passed"],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function clampBatchSize(value: number | undefined): number {
  if (!value || value < 1) return 10;
  return Math.min(50, Math.floor(value));
}

/**
 * Select eligible, non-suppressed leads for a batch operation. Paid leads
 * (Stripe Checkout completed) jump the queue: they're selected first, oldest
 * first, then the remaining slots are filled with unpaid leads, also oldest
 * first.
 */
async function selectBatchLeads(operation: BatchOperation, batchSize: number) {
  const where = { status: { in: DEFAULT_STATUSES[operation] }, doNotContact: false };

  const paidLeads = await prisma.lead.findMany({
    where: { ...where, paymentStatus: "paid" },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  });

  const remaining = batchSize - paidLeads.length;
  if (remaining <= 0) return paidLeads;

  const otherLeads = await prisma.lead.findMany({
    where: { ...where, paymentStatus: { not: "paid" } },
    orderBy: { createdAt: "asc" },
    take: remaining,
  });

  return [...paidLeads, ...otherLeads];
}

async function processLead(operation: BatchOperation, leadId: string, createdBy: string): Promise<string> {
  switch (operation) {
    case "full_pipeline": {
      const r = await runLeadPipeline(leadId, { createdBy });
      return r.outcome === "audited" ? `audited (${r.auditScore}/100, ${r.opportunity})` : r.outcome;
    }
    case "preview": {
      const gen = await runPreviewGeneration(leadId, { createdBy });
      const qc = await runPreviewQc(gen.previewId, { createdBy });
      return `preview ${gen.slug} - QC ${qc.qcStatus}`;
    }
    case "email": {
      const r = await runEmailDrafting(leadId, "direct_preview", { createdBy });
      return `email drafted - QC ${r.qcStatus}`;
    }
  }
}

/**
 * Run a batch. Selects up to `batchSize` eligible, non-suppressed leads for the
 * operation and processes them one at a time with a delay between each.
 */
export async function runBatch(options: BatchOptions): Promise<BatchResult> {
  const batchSize = clampBatchSize(options.batchSize);
  const createdBy = options.createdBy ?? "batch";
  const delayMs = options.delayMs ?? 250;

  const leads = await selectBatchLeads(options.operation, batchSize);

  const results: BatchRowResult[] = [];
  for (const lead of leads) {
    try {
      const detail = await processLead(options.operation, lead.id, createdBy);
      results.push({ leadId: lead.id, businessName: lead.businessName, ok: true, detail });
    } catch (err) {
      results.push({
        leadId: lead.id,
        businessName: lead.businessName,
        ok: false,
        detail: err instanceof Error ? err.message : "Failed",
      });
    }
    if (delayMs > 0) await sleep(delayMs);
  }

  return {
    operation: options.operation,
    batchSize,
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}
