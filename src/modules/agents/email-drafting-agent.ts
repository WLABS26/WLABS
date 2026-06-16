/**
 * Email Drafting Agent.
 *
 * Generates a personalized, compliant outreach email for a prospect using the
 * audit findings and preview link. Produces seven variants (direct preview,
 * audit-first, audit-comparison, soft consult, two follow-ups, breakup). Every email is
 * business-only, names one or two objective observations, includes the preview
 * link and a clear CTA, states the fixed price, and carries an opt-out line.
 *
 * Language is auto-detected from the lead's country field: DE/AT/CH → German,
 * all other countries → English.
 *
 * Output is always a DRAFT - nothing is ever sent automatically.
 */
import { z } from "zod";

import { generateStructured } from "@/lib/ai/generate";
import { isMockProvider } from "@/lib/ai/provider";
import { Agent } from "./base-agent";
import type { AgentExecuteContext } from "./types";

type Lang = "en" | "de";

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
  bestPracticeComparison: z.string().nullable().default(null),
  benchmarkGap: z.string().nullable().default(null),
  criticalFindings: z.array(z.string()).default([]),
  variant: z.enum(["direct_preview", "audit_first", "audit_comparison", "soft_consult", "follow_up_1", "follow_up_2", "breakup"]),
  language: z.enum(["en", "de"]).default("en"),
});

const outputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  variant: z.enum(["direct_preview", "audit_first", "audit_comparison", "soft_consult", "follow_up_1", "follow_up_2", "breakup"]),
  ctaType: z.enum(["preview", "booking", "reply"]),
  personalizationFields: z.array(z.string()),
  previewLink: z.string().nullable(),
  complianceFlags: z.array(z.string()),
  status: z.enum(["draft", "needs_review", "do_not_send"]),
  language: z.enum(["en", "de"]),
});

export type EmailDraftingInput = z.infer<typeof inputSchema>;
export type EmailDraftingOutput = z.infer<typeof outputSchema>;

const OPT_OUT: Record<Lang, string> = {
  en: 'If this isn\'t relevant, just reply "no thanks" and I won\'t contact you again.',
  de: 'Falls das gerade nicht passt, antworten Sie einfach mit "Nein danke" – ich melde mich nicht mehr.',
};

const aiCopySchema = z.object({
  subject: z.string(),
  body: z.string(),
});

function buildAiSystemPrompt(input: EmailDraftingInput): string {
  const lang = input.language;
  const langInstruction = lang === "de" ? "Write entirely in German (formal Sie address)." : "Write in English.";
  const optOut = OPT_OUT[lang];
  const linkRequirement = input.previewUrl
    ? ` and MUST include this exact preview link somewhere in the body: ${input.previewUrl}`
    : "";
  return (
    `${langInstruction} You are a sales copywriter for WLABS, a service that builds website redesign concepts for local businesses. ` +
    "Rewrite the given draft email's subject and body to feel more personal and specific to this business, while " +
    "keeping the same tone, structure, and call to action for this variant. Keep it under 150 words. Do not invent " +
    "discounts, urgency, fake scarcity, testimonials, or guarantees. The email MUST end with this exact line, " +
    `verbatim: "${optOut}"${linkRequirement}. Respond with ONLY a JSON object of the form ` +
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
Language: ${input.language === "de" ? "German (formal Sie)" : "English"}

Draft email to rewrite (same JSON shape expected back - "subject" and "body" only):
${JSON.stringify(draft, null, 2)}`;
}

function greeting(lang: Lang, input: EmailDraftingInput): string {
  if (lang === "de") {
    return input.contactPerson
      ? `Hallo ${input.contactPerson.split(" ")[0]},`
      : `Guten Tag, Team ${input.businessName},`;
  }
  return input.contactPerson ? `Hi ${input.contactPerson.split(" ")[0]},` : `Hi ${input.businessName} team,`;
}

function priceLine(lang: Lang, input: EmailDraftingInput): string {
  const symbol = input.currency === "EUR" ? "€" : input.currency === "GBP" ? "£" : `${input.currency} `;
  if (lang === "de") {
    return `WLABS kann das für nur ${symbol}${input.price} als fertige Live-Website umsetzen.`;
  }
  return `WLABS can turn this into a live MVP website for ${symbol}${input.price} fixed.`;
}

function observations(lang: Lang, input: EmailDraftingInput): string {
  const issues = input.topIssues.slice(0, 2);
  if (lang === "de") {
    if (issues.length === 0) return "einige Kleinigkeiten, die es Besuchern schwer machen, schnell Kontakt aufzunehmen";
    return issues.map((i) => `\n• ${i}`).join("");
  }
  if (issues.length === 0) return "a few small things that could make it easier for visitors to contact you quickly";
  return issues.map((i) => `\n• ${i}`).join("");
}

function criticalFindingsList(lang: Lang, input: EmailDraftingInput): string {
  const findings = input.criticalFindings.slice(0, 3);
  if (findings.length === 0) return observations(lang, input);
  return findings.map((f) => `\n• ${f}`).join("");
}

function benchmarkLine(input: EmailDraftingInput): string {
  const parts = [input.bestPracticeComparison, input.benchmarkGap].filter((v): v is string => Boolean(v && v.trim()));
  return parts.join(" ");
}

function signOff(lang: Lang, input: EmailDraftingInput): string {
  if (lang === "de") return `Beste Grüße,\n${input.senderName}\nWLABS — Website Laboratory`;
  return `Best,\n${input.senderName}\nWLABS — Website Laboratory`;
}

function bookingLine(lang: Lang, input: EmailDraftingInput): string {
  if (!input.bookingUrl) return "";
  if (lang === "de") return `\n\nLieber direkt sprechen? 15-Minuten-Call buchen: ${input.bookingUrl}`;
  return `\n\nPrefer a quick chat? Book a 15-minute call: ${input.bookingUrl}`;
}

function buildEmail(input: EmailDraftingInput): { subject: string; body: string; ctaType: "preview" | "booking" | "reply" } {
  const lang = input.language;
  const g = greeting(lang, input);
  const preview = input.previewUrl;
  const obs = observations(lang, input);
  const opt = OPT_OUT[lang];

  switch (input.variant) {
    case "direct_preview":
      if (lang === "de") {
        return {
          subject: `Ein modernes Website-Konzept für ${input.businessName}`,
          ctaType: "preview",
          body: `${g}

Ich bin auf Ihre Website aufmerksam geworden und habe ein modernes Homepage-Konzept für ${input.businessName} entwickelt:

${preview ?? "[Vorschau-Link]"}

Es ist nur eine Vorschau, zeigt aber, wie Ihre Website mit klaren Botschaften, mobilem Design und sichtbaren Kontaktmöglichkeiten aussehen könnte.

${priceLine(lang, input)} Soll ich die Liveversion vorbereiten?${bookingLine(lang, input)}

${signOff(lang, input)}

${opt}`,
        };
      }
      return {
        subject: `A modern homepage concept for ${input.businessName}`,
        ctaType: "preview",
        body: `${g}

I came across your website and put together a quick, modern homepage concept for ${input.businessName}:

${preview ?? "[preview link]"}

It's only a preview, but it shows how your site could look with clearer messaging, stronger mobile design, and more visible contact options.

${priceLine(lang, input)} Would you like me to prepare the launch version?${bookingLine(lang, input)}

${signOff(lang, input)}

${opt}`,
      };

    case "audit_first":
      if (lang === "de") {
        return {
          subject: `Website-Idee für ${input.businessName}`,
          ctaType: "preview",
          body: `${g}

Ich habe Ihre aktuelle Website analysiert und einige Punkte gefunden, die es Besuchern schwer machen, Kontakt aufzunehmen:${obs}

Deshalb habe ich ein modernes Konzept entwickelt, das zeigt, wie es besser funktionieren könnte:

${preview ?? "[Vorschau-Link]"}

${priceLine(lang, input)}${bookingLine(lang, input)}

${signOff(lang, input)}

${opt}`,
        };
      }
      return {
        subject: `Quick website idea for ${input.businessName}`,
        ctaType: "preview",
        body: `${g}

I had a look at your current website and noticed a couple of things that may be making it harder for visitors to get in touch:${obs}

So I built a quick modern concept showing how it could work better:

${preview ?? "[preview link]"}

${priceLine(lang, input)}${bookingLine(lang, input)}

${signOff(lang, input)}

${opt}`,
      };

    case "audit_comparison": {
      const benchmark = benchmarkLine(input);
      const benchmarkParagraph = benchmark ? `\n\n${benchmark}` : "";
      if (lang === "de") {
        return {
          subject: `So schneidet ${input.businessName} im Vergleich zu anderen ${input.industryLabel}-Websites ab`,
          ctaType: "preview",
          body: `${g}

Ich habe Ihre Website mit anderen ${input.industryLabel}-Betrieben${input.city ? ` in ${input.city}` : ""} verglichen – einige Punkte fielen besonders auf:${criticalFindingsList(lang, input)}${benchmarkParagraph}

Hier ist ein Konzept, das zeigt, wie das für ${input.businessName} besser aussehen könnte:

${preview ?? "[Vorschau-Link]"}

${priceLine(lang, input)}${bookingLine(lang, input)}

${signOff(lang, input)}

${opt}`,
        };
      }
      return {
        subject: `How ${input.businessName} compares to other ${input.industryLabel.toLowerCase()} sites`,
        ctaType: "preview",
        body: `${g}

I ran a quick comparison of your website against other ${input.industryLabel.toLowerCase()} businesses${input.city ? ` in ${input.city}` : ""}, and a few things stood out:${criticalFindingsList(lang, input)}${benchmarkParagraph}

So I put together a concept showing what that could look like for ${input.businessName}:

${preview ?? "[preview link]"}

${priceLine(lang, input)}${bookingLine(lang, input)}

${signOff(lang, input)}

${opt}`,
      };
    }

    case "soft_consult":
      if (lang === "de") {
        return {
          subject: `${input.businessName} Website — kurzer Blick wert?`,
          ctaType: "booking",
          body: `${g}

Ich helfe ${input.industryLabel}-Betrieben${input.city ? ` in ${input.city}` : ""}, ihren Webauftritt zu modernisieren. Ich habe ein unverbindliches Konzept für ${input.businessName} erstellt:

${preview ?? "[Vorschau-Link]"}

Kein Druck – ich erkläre gerne, was ich mir dabei gedacht habe.${bookingLine(lang, input)}

${signOff(lang, input)}

${opt}`,
        };
      }
      return {
        subject: `${input.businessName} website — worth a quick look?`,
        ctaType: "booking",
        body: `${g}

I help ${input.industryLabel.toLowerCase()} businesses${input.city ? ` in ${input.city}` : ""} modernise their websites. I put together a no-obligation concept for ${input.businessName} you're welcome to see:

${preview ?? "[preview link]"}

No pressure at all — happy to talk it through if useful.${bookingLine(lang, input)}

${signOff(lang, input)}

${opt}`,
      };

    case "follow_up_1":
      if (lang === "de") {
        return {
          subject: `Re: Modernes Homepage-Konzept für ${input.businessName}`,
          ctaType: "preview",
          body: `${g}

Kurze Nachfrage zum Homepage-Konzept für ${input.businessName}:

${preview ?? "[Vorschau-Link]"}

Gerne passe ich Einzelheiten an. ${priceLine(lang, input)}

${signOff(lang, input)}

${opt}`,
        };
      }
      return {
        subject: `Re: a modern homepage concept for ${input.businessName}`,
        ctaType: "preview",
        body: `${g}

Just following up on the homepage concept I made for ${input.businessName}:

${preview ?? "[preview link]"}

Happy to tweak anything you'd like to see done differently. ${priceLine(lang, input)}

${signOff(lang, input)}

${opt}`,
      };

    case "follow_up_2":
      if (lang === "de") {
        return {
          subject: `Soll ich die Anfrage für ${input.businessName} abschließen?`,
          ctaType: "reply",
          body: `${g}

Ich möchte Ihr Postfach nicht weiter belasten – das ist meine letzte Nachricht zum Homepage-Konzept:

${preview ?? "[Vorschau-Link]"}

Falls der Zeitpunkt nicht passt, kein Problem – melden Sie sich einfach, wenn es passt.

${signOff(lang, input)}

${opt}`,
        };
      }
      return {
        subject: `Should I close the file on this, ${input.businessName}?`,
        ctaType: "reply",
        body: `${g}

I don't want to clutter your inbox, so this is my last note about the homepage concept:

${preview ?? "[preview link]"}

If now isn't the right time, no problem at all — just let me know.

${signOff(lang, input)}

${opt}`,
      };

    case "breakup":
    default:
      if (lang === "de") {
        return {
          subject: `Abschluss der Anfrage, ${input.businessName}`,
          ctaType: "reply",
          body: `${g}

Ich gehe davon aus, dass der Zeitpunkt gerade nicht passt, und melde mich nicht weiter. Das Konzept bleibt verfügbar, falls Sie es später noch sehen möchten:

${preview ?? "[Vorschau-Link]"}

Alles Gute für Sie und Ihr Team.

${signOff(lang, input)}

${opt}`,
        };
      }
      return {
        subject: `Closing the loop, ${input.businessName}`,
        ctaType: "reply",
        body: `${g}

I'll assume the timing isn't right and won't follow up again. The concept stays here if you ever want it:

${preview ?? "[preview link]"}

Wishing you and ${input.businessName} all the best.

${signOff(lang, input)}

${opt}`,
      };
  }
}

export class EmailDraftingAgent extends Agent<EmailDraftingInput, EmailDraftingOutput> {
  readonly name = "email_drafting_agent";
  readonly description = "Drafts a personalized, compliant outreach email (one of seven variants) for a prospect.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = outputSchema;

  protected async execute(input: EmailDraftingInput, ctx: AgentExecuteContext): Promise<EmailDraftingOutput> {
    const draft = buildEmail(input);
    const lang = input.language;
    const optOut = OPT_OUT[lang];

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
        ctx.log("info", `Enhanced email draft with AI (${lang})`);
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
      input.criticalFindings.length > 0 ? "criticalFindings" : null,
      input.previewUrl ? "previewUrl" : null,
    ].filter((v): v is string => Boolean(v));

    const previewLinkPlaceholder = lang === "de" ? "[Vorschau-Link]" : "[preview link]";
    const missingOptOut = lang === "de"
      ? !body.includes("Nein danke") && !body.includes("nein danke")
      : !body.includes("no thanks");

    const complianceFlags: string[] = [];
    if (!input.previewUrl) complianceFlags.push("No preview link available.");
    if (missingOptOut) complianceFlags.push("Missing opt-out line.");
    if (input.previewUrl && !body.includes(input.previewUrl)) complianceFlags.push("Preview link missing from email body.");
    if (body.includes(previewLinkPlaceholder)) complianceFlags.push("Unresolved preview link placeholder in body.");
    if (input.variant === "audit_comparison" && !input.bestPracticeComparison && !input.benchmarkGap && input.criticalFindings.length === 0) {
      complianceFlags.push("No audit comparison data available - run an audit first.");
    }
    void optOut;

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
      language: lang,
    };
  }
}

export const emailDraftingAgent = new EmailDraftingAgent();
