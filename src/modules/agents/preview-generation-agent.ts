/**
 * Preview Generation Agent.
 *
 * Produces the structured content + theme for a convincing MVP homepage concept
 * from the redesign brief, industry template, and the business's real contact
 * details. It NEVER invents reviews, awards, certifications, or regulated
 * claims - trust elements are neutral placeholders unless real proof was found.
 */
import { z } from "zod";

import { industryLabel, selectIndustryTemplate } from "@/modules/generator/industry-templates";
import { Agent } from "./base-agent";

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
});

const outputSchema = z.object({
  content: previewContentSchema,
  theme: previewThemeSchema,
});

export type PreviewGenerationInput = z.infer<typeof inputSchema>;
export type PreviewGenerationOutput = z.infer<typeof outputSchema>;

export class PreviewGenerationAgent extends Agent<PreviewGenerationInput, PreviewGenerationOutput> {
  readonly name = "preview_generator_agent";
  readonly description = "Generates structured MVP homepage content + theme for a lead's preview concept.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = outputSchema;

  protected async execute(input: PreviewGenerationInput): Promise<PreviewGenerationOutput> {
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

    return {
      content,
      theme: { from: template.theme.from, to: template.theme.to, visualStyle: template.visualStyle },
    };
  }
}

export const previewGenerationAgent = new PreviewGenerationAgent();
