/**
 * Email Drafting Agent.
 *
 * Generates a personalized, compliant outreach email for a prospect using the
 * audit findings and preview link. Produces six variants (direct preview,
 * audit-first, soft consult, two follow-ups, breakup). Every email is
 * business-only, names one or two objective observations, includes the preview
 * link and a clear CTA, states the fixed price, and carries an opt-out line.
 *
 * Output is always a DRAFT - nothing is ever sent automatically.
 */
import { z } from "zod";

import { generateStructured } from "@/lib/ai/generate";
import { isMockProvider } from "@/lib/ai/provider";
import { Agent } from "./base-agent";
import type { AgentExecuteContext } from "./types";

const inputSchema = z.object({
  businessName: z.string(),
  contactPerson: z.string().nullable(),
  city: z.string().nullable(),
  industryLabel: z.string(),
  auditScore: z.number().nullable(),
  topIssues: z.array(z.string()),
  previewUrl: z.string().nullable(),
  bookingUrl: z.string().nullable(),
  price: z.number(),
  currency: z.string(),
  senderName: z.string(),
  variant: z.enum(["direct_preview", "audit_first", "soft_consult", "follow_up_1", "follow_up_2", "breakup"]),
});

const outputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  variant: z.enum(["direct_preview", "audit_first", "soft_consult", "follow_up_1", "follow_up_2", "breakup"]),
  ctaType: z.enum(["preview", "booking", "reply"]),
  personalizationFields: z.array(z.string()),
  previewLink: z.string().nullable(),
  complianceFlags: z.array(z.string()),
  status: z.enum(["draft", "needs_review", "do_not_send"]),
});

export type EmailDraftingInput = z.infer<typeof inputSchema>;
export type EmailDraftingOutput = z.infer<typeof outputSchema>;

const OPT_OUT = 'If this isn’t relevant, just reply "no thanks" and I won’t contact you again.';

/** Subset of the email an AI provider may rewrite for sharper, business-specific copy. */
const aiCopySchema = z.object({
  subject: z.string(),
  body: z.string(),
});

function buildAiSystemPrompt(input: EmailDraftingInput): string {
  const linkRequirement = input.previewUrl
    ? ` and MUST include this exact preview link somewhere in the body: ${input.previewUrl}`
    : "";
  return (
    "You are a sales copywriter for WLABS, a service that builds website redesign concepts for local businesses. " +
    "Rewrite the given draft email's subject and body to feel more personal and specific to this business, while " +
    "keeping the same tone, structure, and call to action for this variant. Keep it under 150 words. Do not invent " +
    "discounts, urgency, fake scarcity, testimonials, or guarantees. The email MUST end with this exact line, " +
    `verbatim: "${OPT_OUT}"${linkRequirement}. Respond with ONLY a JSON object of the form ` +
    '{"subject": "...", "body": "..."} - no markdown, no commentary, no code fences.'
  );
}

function buildAiPrompt(input: EmailDraftingInput, draft: { subject: string; body: string }): string {
  return `Business: ${input.businessName}${input.contactPerson ? ` (contact: ${input.contactPerson})` : ""}
Industry: ${input.industryLabel}
Location: ${input.city ?? "unspecified"}
Audit score: ${input.auditScore !== null ? `${input.auditScore}/100` : "not scored"}
Top issues found: ${input.topIssues.join("; ") || "none recorded"}
Email variant: ${input.variant}
Fixed price: ${input.price} ${input.currency}

Draft email to rewrite (same JSON shape expected back - "subject" and "body" only):
${JSON.stringify(draft, null, 2)}`;
}

function greeting(input: EmailDraftingInput): string {
  return input.contactPerson ? `Hi ${input.contactPerson.split(" ")[0]},` : `Hi ${input.businessName} team,`;
}

function priceLine(input: EmailDraftingInput): string {
  const symbol = input.currency === "EUR" ? "€" : input.currency === "GBP" ? "£" : `${input.currency} `;
  return `WLABS can turn this into a live MVP website for ${symbol}${input.price} fixed.`;
}

function observations(input: EmailDraftingInput): string {
  const issues = input.topIssues.slice(0, 2);
  if (issues.length === 0) return "a few small things that could make it easier for visitors to contact you quickly";
  return issues.map((i) => `\n• ${i}`).join("");
}

function signOff(input: EmailDraftingInput): string {
  return `Best,\n${input.senderName}\nWLABS — Website Laboratory`;
}

function bookingLine(input: EmailDraftingInput): string {
  return input.bookingUrl ? `\n\nPrefer a quick chat? Book a 15-minute call: ${input.bookingUrl}` : "";
}

function buildEmail(input: EmailDraftingInput): { subject: string; body: string; ctaType: "preview" | "booking" | "reply" } {
  const g = greeting(input);
  const preview = input.previewUrl;
  const obs = observations(input);

  switch (input.variant) {
    case "direct_preview":
      return {
        subject: `A modern homepage concept for ${input.businessName}`,
        ctaType: "preview",
        body: `${g}

I came across your website and put together a quick, modern homepage concept for ${input.businessName}:

${preview ?? "[preview link]"}

It’s only a preview, but it shows how your site could look with clearer messaging, stronger mobile design, and more visible contact options.

${priceLine(input)} Would you like me to prepare the launch version?${bookingLine(input)}

${signOff(input)}

${OPT_OUT}`,
      };

    case "audit_first":
      return {
        subject: `Quick website idea for ${input.businessName}`,
        ctaType: "preview",
        body: `${g}

I had a look at your current website and noticed a couple of things that may be making it harder for visitors to get in touch:${obs}

So I built a quick modern concept showing how it could work better:

${preview ?? "[preview link]"}

${priceLine(input)}${bookingLine(input)}

${signOff(input)}

${OPT_OUT}`,
      };

    case "soft_consult":
      return {
        subject: `${input.businessName} website — worth a quick look?`,
        ctaType: "booking",
        body: `${g}

I help ${input.industryLabel.toLowerCase()} businesses${input.city ? ` in ${input.city}` : ""} modernise their websites. I put together a no-obligation concept for ${input.businessName} you’re welcome to see:

${preview ?? "[preview link]"}

No pressure at all — happy to talk it through if useful.${bookingLine(input)}

${signOff(input)}

${OPT_OUT}`,
      };

    case "follow_up_1":
      return {
        subject: `Re: a modern homepage concept for ${input.businessName}`,
        ctaType: "preview",
        body: `${g}

Just following up on the homepage concept I made for ${input.businessName}:

${preview ?? "[preview link]"}

Happy to tweak anything you’d like to see done differently. ${priceLine(input)}

${signOff(input)}

${OPT_OUT}`,
      };

    case "follow_up_2":
      return {
        subject: `Should I close the file on this, ${input.businessName}?`,
        ctaType: "reply",
        body: `${g}

I don’t want to clutter your inbox, so this is my last note about the homepage concept:

${preview ?? "[preview link]"}

If now isn’t the right time, no problem at all — just let me know.

${signOff(input)}

${OPT_OUT}`,
      };

    case "breakup":
    default:
      return {
        subject: `Closing the loop, ${input.businessName}`,
        ctaType: "reply",
        body: `${g}

I’ll assume the timing isn’t right and won’t follow up again. The concept stays here if you ever want it:

${preview ?? "[preview link]"}

Wishing you and ${input.businessName} all the best.

${signOff(input)}

${OPT_OUT}`,
      };
  }
}

export class EmailDraftingAgent extends Agent<EmailDraftingInput, EmailDraftingOutput> {
  readonly name = "email_drafting_agent";
  readonly description = "Drafts a personalized, compliant outreach email (one of six variants) for a prospect.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = outputSchema;

  protected async execute(input: EmailDraftingInput, ctx: AgentExecuteContext): Promise<EmailDraftingOutput> {
    const draft = buildEmail(input);

    let subject = draft.subject;
    let body = draft.body;
    const { ctaType } = draft;

    if (!isMockProvider()) {
      const aiCopy = await generateStructured({
        system: buildAiSystemPrompt(input),
        prompt: buildAiPrompt(input, draft),
        schema: aiCopySchema,
      });

      if (aiCopy) {
        ctx.log("info", "Enhanced email draft with AI");
        subject = aiCopy.subject;
        body = aiCopy.body;
      } else {
        ctx.log("warn", "AI email generation unavailable, using template output");
      }
    }

    const personalizationFields = [
      "businessName",
      input.contactPerson ? "contactPerson" : null,
      input.city ? "city" : null,
      input.topIssues.length > 0 ? "auditIssues" : null,
      input.previewUrl ? "previewUrl" : null,
    ].filter((v): v is string => Boolean(v));

    // Compliance self-checks - flags route the draft to needs_review. Re-checked
    // against the final body regardless of whether it came from AI or template.
    const complianceFlags: string[] = [];
    if (!input.previewUrl) complianceFlags.push("No preview link available.");
    if (!body.includes("no thanks")) complianceFlags.push("Missing opt-out line.");
    if (input.previewUrl && !body.includes(input.previewUrl)) complianceFlags.push("Preview link missing from email body.");

    const status = complianceFlags.length > 0 ? "needs_review" : "draft";

    return {
      subject,
      body,
      variant: input.variant,
      ctaType,
      personalizationFields,
      previewLink: input.previewUrl,
      complianceFlags,
      status,
    };
  }
}

export const emailDraftingAgent = new EmailDraftingAgent();
