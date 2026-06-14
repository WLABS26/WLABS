/**
 * Lead Qualification Agent.
 *
 * Decides whether a lead is worth running through the crawl/audit/preview
 * pipeline. Pure and DB-free: the caller supplies suppression/duplicate flags
 * (resolved against the database in the pipeline) so this agent stays trivially
 * testable.
 */
import { z } from "zod";

import { Agent } from "./base-agent";

const inputSchema = z.object({
  businessName: z.string(),
  industry: z.string(),
  websiteUrl: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  doNotContact: z.boolean(),
  isSuppressed: z.boolean(),
  isDuplicate: z.boolean(),
});

const outputSchema = z.object({
  qualificationStatus: z.enum(["ready_for_crawl", "needs_manual_review", "rejected"]),
  reasons: z.array(z.string()),
});

export type LeadQualificationInput = z.infer<typeof inputSchema>;
export type LeadQualificationOutput = z.infer<typeof outputSchema>;

function isValidHttpUrl(value: string | null): boolean {
  if (!value) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export class LeadQualificationAgent extends Agent<LeadQualificationInput, LeadQualificationOutput> {
  readonly name = "lead_qualification_agent";
  readonly description = "Qualifies a lead for the crawl/audit pipeline based on website, contact, and compliance checks.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = outputSchema;

  protected async execute(input: LeadQualificationInput): Promise<LeadQualificationOutput> {
    const reasons: string[] = [];

    // Compliance gates - any of these rejects the lead outright.
    if (input.doNotContact) reasons.push("Lead is marked do-not-contact.");
    if (input.isSuppressed) reasons.push("Lead matches the suppression list.");
    if (input.isDuplicate) reasons.push("Lead is a duplicate of an existing record.");
    if (reasons.length > 0) {
      return { qualificationStatus: "rejected", reasons };
    }

    const hasContact = Boolean(input.contactEmail || input.contactPhone);
    const hasValidWebsite = isValidHttpUrl(input.websiteUrl);

    if (!hasContact) {
      return {
        qualificationStatus: "rejected",
        reasons: ["No business contact (email or phone) available for outreach."],
      };
    }

    if (!hasValidWebsite) {
      reasons.push("No valid website URL - cannot run the automated crawl/audit.");
      return { qualificationStatus: "needs_manual_review", reasons };
    }

    reasons.push("Has a valid website and a business contact; ready for crawl.");
    return { qualificationStatus: "ready_for_crawl", reasons };
  }
}

export const leadQualificationAgent = new LeadQualificationAgent();
