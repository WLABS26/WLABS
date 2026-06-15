/**
 * Preview Generation Agent.
 *
 * Produces the structured content + theme for a convincing MVP homepage concept
 * from the redesign brief, industry template, and the business's real contact
 * details. It NEVER invents reviews, awards, certifications, or regulated
 * claims - trust elements are neutral placeholders unless real proof was found.
 */
import { z } from "zod";

import { generateStructured } from "@/lib/ai/generate";
import { isMockProvider } from "@/lib/ai/provider";
import { industryLabel, resolveTheme, selectIndustryTemplate } from "@/modules/generator/industry-templates";
import { Agent } from "./base-agent";
import type { AgentExecuteContext } from "./types";

const ctaSchema = z.object({
  label: z.string(),
  type: z.enum(["form", "phone", "booking", "link"]),
  value: z.string().optional(),
});

const previewContentSchema = z.object({
  meta: z.object({
    businessName: z.string(),
    industry: z.string(),
    industryLabel: z.string(),
    city: z.string().nullable(),
    tagline: z.string(),
  }),
  hero: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    subheadline: z.string(),
    primaryCta: ctaSchema,
    secondaryCta: ctaSchema,
    trustCue: z.string(),
  }),
  problem: z.object({ heading: z.string(), points: z.array(z.string()) }),
  services: z.object({
    heading: z.string(),
    intro: z.string(),
    items: z.array(z.object({ title: z.string(), description: z.string() })),
  }),
  whyUs: z.object({
    heading: z.string(),
    reasons: z.array(z.object({ title: z.string(), description: z.string() })),
  }),
  trust: z.object({ heading: z.string(), note: z.string(), items: z.array(z.string()) }),
  local: z.object({
    heading: z.string(),
    address: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    hours: z.string().nullable(),
    serviceArea: z.string().nullable(),
    showMap: z.boolean(),
  }),
  contact: z.object({ heading: z.string(), subheading: z.string(), fields: z.array(z.string()) }),
  finalCta: z.object({ heading: z.string(), subheading: z.string(), cta: ctaSchema }),
});

const previewThemeSchema = z.object({
  from: z.string(),
  to: z.string(),
  visualStyle: z.enum(["modern", "warm", "bold", "clinical", "premium"]),
  fontFamily: z.string().nullable(),
});

const inputSchema = z.object({
  businessName: z.string(),
  industry: z.string(),
  city: z.string().nullable(),
  contactPhone: z.string().nullable(),
  contactEmail: z.string().nullable(),
  addressHint: z.string().nullable(),
  headline: z.string(),
  subheadline: z.string(),
  brandColors: z.array(z.string()),
  fontFamily: z.string().nullable(),
});

const outputSchema = z.object({
  content: previewContentSchema,
  theme: previewThemeSchema,
});

export type PreviewGenerationInput = z.infer<typeof inputSchema>;
export type PreviewGenerationOutput = z.infer<typeof outputSchema>;

/**
 * Copy-only subset of the preview content an AI provider may rewrite.
 * Deliberately excludes `meta`, `local.*` contact details, CTA `type`/`value`,
 * `theme`, and all of `trust` (credibility elements stay neutral placeholders -
 * never AI-generated, per the no-fabrication rule above).
 */
const previewCopySchema = z.object({
  hero: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    subheadline: z.string(),
    trustCue: z.string(),
  }),
  problem: z.object({ heading: z.string(), points: z.array(z.string()).min(2).max(5) }),
  services: z.object({
    heading: z.string(),
    intro: z.string(),
    items: z.array(z.object({ title: z.string(), description: z.string() })).min(2).max(6),
  }),
  whyUs: z.object({
    heading: z.string(),
    reasons: z.array(z.object({ title: z.string(), description: z.string() })).min(2).max(5),
  }),
  local: z.object({ heading: z.string() }),
  contact: z.object({ heading: z.string(), subheading: z.string() }),
  finalCta: z.object({ heading: z.string(), subheading: z.string() }),
});

const AI_SYSTEM_PROMPT =
  "You are a senior copywriter for WLABS, a service that creates MVP homepage redesign concepts for local " +
  "businesses. Rewrite the copy fields of the given draft homepage content to be more specific and compelling for " +
  "the business described, while keeping the same JSON shape and field meanings. Never invent reviews, awards, " +
  "certifications, testimonials, statistics, or regulated claims that weren't given to you. Respond with ONLY a " +
  "JSON object matching the shape shown - no markdown, no commentary, no code fences.";

function buildAiPrompt(input: PreviewGenerationInput, draft: PreviewGenerationOutput["content"]): string {
  return `Business: ${input.businessName}
Industry: ${industryLabel(input.industry)}
Location: ${input.city ?? "unspecified"}

Draft homepage copy to rewrite (same JSON shape expected back):
${JSON.stringify(
  {
    hero: {
      eyebrow: draft.hero.eyebrow,
      headline: draft.hero.headline,
      subheadline: draft.hero.subheadline,
      trustCue: draft.hero.trustCue,
    },
    problem: draft.problem,
    services: draft.services,
    whyUs: draft.whyUs,
    local: { heading: draft.local.heading },
    contact: { heading: draft.contact.heading, subheading: draft.contact.subheading },
    finalCta: { heading: draft.finalCta.heading, subheading: draft.finalCta.subheading },
  },
  null,
  2,
)}`;
}

export class PreviewGenerationAgent extends Agent<PreviewGenerationInput, PreviewGenerationOutput> {
  readonly name = "preview_generator_agent";
  readonly description = "Generates structured MVP homepage content + theme for a lead's preview concept.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = outputSchema;

  protected async execute(input: PreviewGenerationInput, ctx: AgentExecuteContext): Promise<PreviewGenerationOutput> {
    const draft = buildTemplateContent(input);

    if (isMockProvider()) return draft;

    const aiCopy = await generateStructured({
      system: AI_SYSTEM_PROMPT,
      prompt: buildAiPrompt(input, draft.content),
      schema: previewCopySchema,
      maxTokens: 1800,
    });

    if (!aiCopy) {
      ctx.log("warn", "AI preview copy unavailable, using template output");
      return draft;
    }

    ctx.log("info", "Enhanced preview copy with AI");
    const { content } = draft;
    return {
      ...draft,
      content: {
        ...content,
        hero: { ...content.hero, ...aiCopy.hero },
        problem: aiCopy.problem,
        services: { ...content.services, ...aiCopy.services },
        whyUs: aiCopy.whyUs,
        local: { ...content.local, heading: aiCopy.local.heading },
        contact: { ...content.contact, ...aiCopy.contact },
        finalCta: { ...content.finalCta, ...aiCopy.finalCta },
      },
    };
  }
}

/** Deterministic, template-driven preview content + theme - used as-is in mock mode and as the AI fallback/seed otherwise. */
function buildTemplateContent(input: PreviewGenerationInput): PreviewGenerationOutput {
  const template = selectIndustryTemplate(input.industry);
  const label = industryLabel(input.industry);
  const city = input.city;

  const primaryCta: z.infer<typeof ctaSchema> = { label: template.primaryCta, type: "form", value: "#contact" };
  const secondaryCta: z.infer<typeof ctaSchema> = { label: template.secondaryCta, type: "link", value: "#services" };

  const content: PreviewGenerationOutput["content"] = {
    meta: {
      businessName: input.businessName,
      industry: input.industry,
      industryLabel: label,
      city,
      tagline: input.subheadline,
    },
    hero: {
      eyebrow: city ? `${label} · ${city}` : label,
      headline: input.headline,
      subheadline: input.subheadline,
      primaryCta,
      secondaryCta,
      trustCue: template.trustCue,
    },
    problem: {
      heading: "Is your current website holding you back?",
      points: template.problemPoints,
    },
    services: {
      heading: "What we offer",
      intro: `Clear, benefit-led services tailored to ${city ? `${city} and the surrounding area` : "your local area"}.`,
      items: template.services,
    },
    whyUs: {
      heading: `Why choose ${input.businessName}`,
      reasons: template.whyUs,
    },
    trust: {
      heading: "Trusted locally",
      note: "Neutral placeholders - replace with the business's real reviews and credentials before launch.",
      items: template.trustElements,
    },
    local: {
      heading: city ? `Serving ${city} and surrounding areas` : "Serving your local area",
      address: input.addressHint,
      phone: input.contactPhone,
      email: input.contactEmail,
      hours: null,
      serviceArea: city ? `${city} and surrounding areas` : null,
      showMap: Boolean(input.addressHint),
    },
    contact: {
      heading: "Get in touch",
      subheading: "Send us a message and we'll get back to you shortly.",
      fields: ["Name", "Email", "Phone", "Message"],
    },
    finalCta: {
      heading: "Ready to modernise your online presence?",
      subheading: `See how ${input.businessName} could look with a clean, conversion-focused homepage.`,
      cta: primaryCta,
    },
  };

  const theme = resolveTheme(input.brandColors, template);

  return {
    content,
    theme: { from: theme.from, to: theme.to, visualStyle: template.visualStyle, fontFamily: input.fontFamily },
  };
}

export const previewGenerationAgent = new PreviewGenerationAgent();
