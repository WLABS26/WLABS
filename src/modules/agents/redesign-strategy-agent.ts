/**
 * Redesign Strategy Agent.
 *
 * Turns an audit into a structured, MVP-constrained redesign brief: what the
 * new homepage should say, prioritise, and look like. Deterministic and
 * template-driven (industry template + the business's own audited details), so
 * it runs offline with no API key. When a real AI provider is configured, the
 * template draft is sent to it for a sharper, business-specific rewrite, with
 * the template output as a guaranteed fallback.
 */
import { z } from "zod";

import { generateStructured } from "@/lib/ai/generate";
import { isMockProvider } from "@/lib/ai/provider";
import { industryLabel, selectIndustryTemplate } from "@/modules/generator/industry-templates";
import { Agent } from "./base-agent";
import type { AgentExecuteContext } from "./types";

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

/** Subset of the brief that an AI provider may rewrite for a sharper, business-specific brief. */
const aiCopySchema = z.object({
  businessSummary: z.string(),
  targetCustomer: z.string(),
  currentWeaknesses: z.array(z.string()).min(1).max(6),
  redesignOpportunities: z.array(z.string()).min(1).max(6),
  recommendedHeadline: z.string(),
  recommendedSubheadline: z.string(),
  visualStyleDirection: z.string(),
  localSeoAngle: z.string(),
  beforeAfterNarrative: z.string(),
  emailPitchAngle: z.string(),
});

const AI_SYSTEM_PROMPT =
  "You are a senior conversion copywriter for WLABS, a service that creates MVP website redesign concepts for " +
  "local businesses. Rewrite the given draft brief to be more specific and compelling for the business described, " +
  "while keeping the same JSON shape and field meanings. Do not invent facts, statistics, awards, certifications, " +
  "testimonials, or pricing that weren't given to you. Respond with ONLY a JSON object matching the shape shown - " +
  "no markdown, no commentary, no code fences.";

function buildAiPrompt(input: RedesignStrategyInput, template: RedesignStrategyOutput): string {
  return `Business: ${input.businessName}
Industry: ${industryLabel(input.industry)}
Location: ${input.city ?? "unspecified"}
Audit score: ${input.auditScore !== null ? `${input.auditScore}/100` : "not scored"}
Top issues found: ${input.topIssues.join("; ") || "none recorded"}
Quick wins: ${input.quickWins.join("; ") || "none recorded"}

Draft brief to rewrite (same JSON shape expected back):
${JSON.stringify(
  {
    businessSummary: template.businessSummary,
    targetCustomer: template.targetCustomer,
    currentWeaknesses: template.currentWeaknesses,
    redesignOpportunities: template.redesignOpportunities,
    recommendedHeadline: template.recommendedHeadline,
    recommendedSubheadline: template.recommendedSubheadline,
    visualStyleDirection: template.visualStyleDirection,
    localSeoAngle: template.localSeoAngle,
    beforeAfterNarrative: template.beforeAfterNarrative,
    emailPitchAngle: template.emailPitchAngle,
  },
  null,
  2,
)}`;
}

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

  protected async execute(input: RedesignStrategyInput, ctx: AgentExecuteContext): Promise<RedesignStrategyOutput> {
    const draft = buildTemplateBrief(input);

    if (isMockProvider()) return draft;

    const aiCopy = await generateStructured({
      system: AI_SYSTEM_PROMPT,
      prompt: buildAiPrompt(input, draft),
      schema: aiCopySchema,
    });

    if (!aiCopy) {
      ctx.log("warn", "AI brief generation unavailable, using template output");
      return draft;
    }

    ctx.log("info", "Enhanced redesign brief with AI");
    return { ...draft, ...aiCopy };
  }
}

/** Deterministic, template-driven redesign brief - used as-is in mock mode and as the AI fallback/seed otherwise. */
function buildTemplateBrief(input: RedesignStrategyInput): RedesignStrategyOutput {
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

export const redesignStrategyAgent = new RedesignStrategyAgent();
