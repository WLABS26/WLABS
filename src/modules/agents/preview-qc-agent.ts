/**
 * Preview Quality Control Agent.
 *
 * Reviews a generated preview before it can be approved: correct business name
 * and industry, a clear CTA, real services, no fabricated testimonials or
 * unsupported/regulated claims, and a non-generic, on-industry concept.
 */
import { z } from "zod";

import { Agent } from "./base-agent";

const inputSchema = z.object({
  expectedBusinessName: z.string(),
  expectedIndustry: z.string(),
  headline: z.string(),
  ctaLabel: z.string(),
  servicesCount: z.number(),
  trustNote: z.string(),
  trustItems: z.array(z.string()),
  metaBusinessName: z.string(),
  metaIndustry: z.string(),
  city: z.string().nullable(),
});

const qcOutputSchema = z.object({
  qcStatus: z.enum(["passed", "needs_review", "failed"]),
  qcIssues: z.array(z.string()),
  recommendedFixes: z.array(z.string()),
});

export type PreviewQcInput = z.infer<typeof inputSchema>;
export type PreviewQcOutput = z.infer<typeof qcOutputSchema>;

/** Words that imply fabricated proof or regulated/over-promising claims. */
const RISKY_CLAIMS = ["guaranteed", "guarantee", "best in", "#1", "number one", "award-winning", "certified", "cure", "pain-free", "100%"];

export class PreviewQcAgent extends Agent<PreviewQcInput, PreviewQcOutput> {
  readonly name = "preview_qc_agent";
  readonly description = "Reviews a generated preview for accuracy, clear CTAs, and brand-safe, non-fabricated content.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = qcOutputSchema;

  protected async execute(input: PreviewQcInput): Promise<PreviewQcOutput> {
    const issues: string[] = [];
    const fixes: string[] = [];
    let critical = false;

    if (input.metaBusinessName !== input.expectedBusinessName) {
      issues.push("Business name on the preview does not match the lead.");
      fixes.push("Regenerate the preview with the correct business name.");
      critical = true;
    }
    if (input.metaIndustry !== input.expectedIndustry) {
      issues.push("Industry on the preview does not match the lead.");
      fixes.push("Regenerate with the correct industry template.");
      critical = true;
    }
    if (!input.ctaLabel.trim()) {
      issues.push("No clear primary call-to-action.");
      fixes.push("Add a primary CTA button to the hero.");
      critical = true;
    }
    if (input.servicesCount < 1) {
      issues.push("No services listed.");
      fixes.push("Add at least three core services.");
      critical = true;
    }

    const trustText = [input.trustNote, ...input.trustItems].join(" ").toLowerCase();
    const fabricated = RISKY_CLAIMS.filter((w) => trustText.includes(w) || input.headline.toLowerCase().includes(w));
    if (fabricated.length > 0) {
      issues.push(`Potentially unsupported/regulated claim(s): ${fabricated.join(", ")}.`);
      fixes.push("Replace with neutral, verifiable language.");
    }
    if (!input.trustNote.toLowerCase().includes("placeholder")) {
      issues.push("Trust elements are not flagged as neutral placeholders.");
      fixes.push("Ensure trust items remain neutral until real proof is confirmed.");
    }

    // Generic-concept check: headline should reference the business or its city.
    const headlineLower = input.headline.toLowerCase();
    const onBrand = headlineLower.includes(input.expectedBusinessName.toLowerCase()) || (input.city ? headlineLower.includes(input.city.toLowerCase()) : false);
    if (!onBrand) {
      issues.push("Headline reads generic (no business name or city).");
      fixes.push("Personalise the headline with the business name or city.");
    }

    const qcStatus = critical ? "failed" : issues.length > 0 ? "needs_review" : "passed";
    return { qcStatus, qcIssues: issues, recommendedFixes: fixes };
  }
}

export const previewQcAgent = new PreviewQcAgent();
