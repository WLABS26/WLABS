/**
 * Website Audit Agent.
 *
 * Wraps the deterministic audit engine (audit-engine/heuristics.ts) in the
 * agent contract: validated input in, validated 100-point audit out. The
 * scoring itself is signal-based and repeatable - the same site always yields
 * the same score.
 */
import { z } from "zod";

import { runAudit } from "@/modules/audit-engine/heuristics";
import { Agent } from "./base-agent";
import { auditResultSchema, extractedWebsiteDataSchema } from "./schemas";

const inputSchema = z.object({
  businessName: z.string(),
  industryLabel: z.string(),
  city: z.string().nullable(),
  hasContact: z.boolean(),
  extractedData: extractedWebsiteDataSchema,
});

export type WebsiteAuditInput = z.infer<typeof inputSchema>;
export type WebsiteAuditOutput = z.infer<typeof auditResultSchema>;

export class WebsiteAuditAgent extends Agent<WebsiteAuditInput, WebsiteAuditOutput> {
  readonly name = "website_audit_agent";
  readonly description = "Scores a captured website against the standardized 100-point WLABS rubric.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = auditResultSchema;

  protected async execute(input: WebsiteAuditInput): Promise<WebsiteAuditOutput> {
    return runAudit({
      data: input.extractedData,
      businessName: input.businessName,
      industryLabel: input.industryLabel,
      city: input.city,
      hasContact: input.hasContact,
    });
  }
}

export const websiteAuditAgent = new WebsiteAuditAgent();
