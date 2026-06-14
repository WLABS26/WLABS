/**
 * Email Quality Control Agent.
 *
 * Reviews an email draft before it can be approved: must include an opt-out and
 * a working preview link, stay concise, carry a clear CTA and personalization,
 * avoid misleading subjects / fake claims / insults / aggressive pressure, and
 * never target a suppressed contact.
 */
import { z } from "zod";

import { Agent } from "./base-agent";

const inputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  businessName: z.string(),
  hasPreviewLink: z.boolean(),
  isSuppressed: z.boolean(),
});

const qcOutputSchema = z.object({
  qcStatus: z.enum(["passed", "needs_review", "failed"]),
  qcIssues: z.array(z.string()),
  recommendedFixes: z.array(z.string()),
});

export type EmailQcInput = z.infer<typeof inputSchema>;
export type EmailQcOutput = z.infer<typeof qcOutputSchema>;

const OVERPROMISE = ["guarantee", "guaranteed", "double your", "triple your", "best in", "#1", "number one", "100%"];
const INSULTS = ["ugly", "terrible", "awful", "embarrassing", "horrible", "pathetic", "garbage"];

export class EmailQcAgent extends Agent<EmailQcInput, EmailQcOutput> {
  readonly name = "email_qc_agent";
  readonly description = "Reviews an outreach email for compliance, tone, clarity, and personalization.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = qcOutputSchema;

  protected async execute(input: EmailQcInput): Promise<EmailQcOutput> {
    const issues: string[] = [];
    const fixes: string[] = [];
    let critical = false;

    const body = input.body.toLowerCase();

    if (input.isSuppressed) {
      issues.push("Recipient is on the suppression list - must not be contacted.");
      fixes.push("Do not send. Keep the lead suppressed.");
      critical = true;
    }
    if (!body.includes("no thanks") && !body.includes("unsubscribe") && !body.includes("opt out")) {
      issues.push("Missing opt-out line.");
      fixes.push('Add: reply "no thanks" and I won’t contact you again.');
      critical = true;
    }
    if (!input.hasPreviewLink || input.body.includes("[preview link]")) {
      issues.push("Preview link is missing or unresolved.");
      fixes.push("Generate the preview first, then re-draft with the real link.");
      critical = true;
    }
    if (input.body.length > 1500) {
      issues.push("Email is too long.");
      fixes.push("Tighten to a few short sentences.");
    }
    if (!input.body.includes(input.businessName)) {
      issues.push("No personalization (business name not mentioned).");
      fixes.push("Reference the business by name.");
    }
    const overpromise = OVERPROMISE.filter((w) => body.includes(w));
    if (overpromise.length > 0) {
      issues.push(`Possible overpromise: ${overpromise.join(", ")}.`);
      fixes.push("Remove guarantees and superlative claims.");
    }
    const insults = INSULTS.filter((w) => body.includes(w));
    if (insults.length > 0) {
      issues.push(`Potentially insulting language: ${insults.join(", ")}.`);
      fixes.push("Keep observations objective and respectful.");
    }
    if (input.subject === input.subject.toUpperCase() && input.subject.length > 8) {
      issues.push("Subject line is all caps (looks like spam).");
      fixes.push("Use sentence case for the subject.");
    }

    const qcStatus = critical ? "failed" : issues.length > 0 ? "needs_review" : "passed";
    return { qcStatus, qcIssues: issues, recommendedFixes: fixes };
  }
}

export const emailQcAgent = new EmailQcAgent();
