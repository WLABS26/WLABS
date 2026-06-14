/**
 * Redesign Strategy Agent.
 *
 * Turns an audit into a structured, MVP-constrained redesign brief: what the
 * new homepage should say, prioritise, and look like. Deterministic and
 * template-driven (industry template + the business's own audited details), so
 * it runs offline; a real AI provider can later enrich the copy via the same
 * input.
 */
import { z } from "zod";

import { industryLabel, selectIndustryTemplate } from "@/modules/generator/industry-templates";
import { Agent } from "./base-agent";

const inputSchema = z.object({
  businessName: z.string(),
  industry: z.string(),
  city: z.string().nullable(),
  auditScore: z.number().nullable(),
  topIssues: z.array(z.string()),
  quickWins: z.array(z.string()),
  recommendedPositioning: z.string().nullable(),
  salesAngle: z.string().nullable(),
});

const outputSchema = z.object({
  businessSummary: z.string(),
  targetCustomer: z.string(),
  currentWeaknesses: z.array(z.string()),
  redesignOpportunities: z.array(z.string()),
  recommendedHeadline: z.string(),
  recommendedSubheadline: z.string(),
  suggestedCtas: z.array(z.string()),
  recommendedSections: z.array(z.string()),
  visualStyleDirection: z.string(),
  credibilityElements: z.array(z.string()),
  localSeoAngle: z.string(),
  beforeAfterNarrative: z.string(),
  emailPitchAngle: z.string(),
});

export type RedesignStrategyInput = z.infer<typeof inputSchema>;
export type RedesignStrategyOutput = z.infer<typeof outputSchema>;

/** Standard, MVP-scoped homepage section order (not a full enterprise site). */
export const MVP_SECTIONS = [
  "Hero",
  "Problem / need",
  "Services / offer",
  "Why choose us",
  "Trust / reviews",
  "Local area / contact",
  "Final CTA",
  "Footer",
];

function fill(template: string, vars: { business: string; city: string }): string {
  return template.replace(/\{business\}/g, vars.business).replace(/\{city\}/g, vars.city);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export class RedesignStrategyAgent extends Agent<RedesignStrategyInput, RedesignStrategyOutput> {
  readonly name = "redesign_brief_agent";
  readonly description = "Turns an audit into a structured, MVP-constrained homepage redesign brief.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = outputSchema;

  protected async execute(input: RedesignStrategyInput): Promise<RedesignStrategyOutput> {
    const template = selectIndustryTemplate(input.industry);
    const label = industryLabel(input.industry).toLowerCase();
    const city = input.city ?? "your area";
    const vars = { business: input.businessName, city };

    const recommendedHeadline = fill(template.headlineTemplates[0], vars);
    const recommendedSubheadline = template.subheadline;

    const businessSummary =
      input.recommendedPositioning ??
      `${input.businessName} is a ${label} serving ${city}. The redesign should present a modern, trustworthy first impression and make it effortless for local customers to get in touch.`;

    const targetCustomer = `Local customers in ${city} searching for a ${label} they can trust, mostly on mobile.`;

    const scoreText = input.auditScore !== null ? `scored ${input.auditScore}/100` : "was assessed";
    const beforeAfterNarrative = `The current site ${scoreText}. The MVP redesign keeps everything that matters - your services and contact details - but presents them in a clean, mobile-first layout with a clear primary call to action, stronger trust cues, and faster routes to contact you.`;

    const emailPitchAngle =
      input.salesAngle ??
      `Show ${input.businessName} a modern concept that fixes their biggest homepage gaps and makes contacting them effortless.`;

    return {
      businessSummary,
      targetCustomer,
      currentWeaknesses: dedupe([...input.topIssues, ...template.problemPoints]).slice(0, 6),
      redesignOpportunities: dedupe([...template.conversionPriorities, ...input.quickWins]).slice(0, 6),
      recommendedHeadline,
      recommendedSubheadline,
      suggestedCtas: dedupe([template.primaryCta, template.secondaryCta, "Request a quote"]),
      recommendedSections: MVP_SECTIONS,
      visualStyleDirection: `${template.visualStyle} - ${template.tone}`,
      credibilityElements: template.trustElements,
      localSeoAngle: fill(template.localAngle, vars),
      beforeAfterNarrative,
      emailPitchAngle,
    };
  }
}

export const redesignStrategyAgent = new RedesignStrategyAgent();
