/**
 * Website Audit Agent.
 *
 * Wraps the deterministic audit engine (audit-engine/heuristics.ts) in the
 * agent contract: validated input in, validated 100-point audit out. The
 * scoring itself is signal-based and repeatable - the same site always yields
 * the same score. When a real AI provider is configured, a critique layer
 * sharpens the qualitative findings (criticalFindings/bestPracticeComparison/
 * benchmarkGap) without ever touching the score, category breakdown, or
 * qualification status - the template critique is a guaranteed fallback.
 */
import { z } from "zod";

import { generateStructured } from "@/lib/ai/generate";
import { isMockProvider } from "@/lib/ai/provider";
import { runAudit } from "@/modules/audit-engine/heuristics";
import { Agent } from "./base-agent";
import { auditResultSchema, extractedWebsiteDataSchema } from "./schemas";
import type { AgentExecuteContext } from "./types";

const inputSchema = z.object({
  businessName: z.string(),
  industryLabel: z.string(),
  city: z.string().nullable(),
  hasContact: z.boolean(),
  extractedData: extractedWebsiteDataSchema,
});

export type WebsiteAuditInput = z.infer<typeof inputSchema>;
export type WebsiteAuditOutput = z.infer<typeof auditResultSchema>;

/** Subset of the audit that an AI provider may sharpen into a harsher, more specific critique. */
const aiCritiqueSchema = z.object({
  criticalFindings: z.array(z.string()).min(3).max(5),
  bestPracticeComparison: z.string(),
  benchmarkGap: z.string(),
});

const AI_SYSTEM_PROMPT =
  "You are a senior UI/UX auditor for WLABS, trained on conversion best practices for local business " +
  "websites. Given a structured summary of a business's current website (extracted text, headings, " +
  "signals, and a deterministic score breakdown), identify the 3-5 most damaging problems for converting " +
  "visitors into customers, compare the site to best-practice websites in the same industry, and describe " +
  "the gap versus market benchmarks. You cannot see the visual design - base your critique only on the " +
  "structure, copy, and signals given. Do not invent facts, statistics, awards, or claims about this " +
  "specific business that weren't given to you. Respond with ONLY a JSON object matching the shape shown " +
  "- no markdown, no commentary, no code fences.";

function buildAiPrompt(input: WebsiteAuditInput, draft: WebsiteAuditOutput): string {
  const d = input.extractedData;
  return `Business: ${input.businessName}
Industry: ${input.industryLabel}
Location: ${input.city ?? "unspecified"}
Overall score: ${draft.overallScore}/100
Category scores: ${JSON.stringify(draft.categoryScores)}
Top issues (deterministic): ${draft.topIssues.join("; ") || "none"}

Extracted signals:
- Title: ${d.title ?? "(none)"}
- Meta description: ${d.metaDescription ?? "(none)"}
- H1: ${d.h1 ?? "(none)"}
- Headings: ${d.headings.join("; ") || "(none)"}
- Text snippets: ${d.textSnippets.join(" / ") || "(none)"}
- Nav labels: ${d.navLabels.join(", ") || "(none)"}
- CTA labels: ${d.ctaLabels.join(", ") || "(none)"}
- Images: ${d.imagesCount}, Forms: ${d.formsCount}, Word count: ${d.wordCount}
- Placeholder/template content detected: ${d.hasPlaceholderContent}

Draft critique to refine (same JSON shape expected back):
${JSON.stringify(
  {
    criticalFindings: draft.criticalFindings,
    bestPracticeComparison: draft.bestPracticeComparison,
    benchmarkGap: draft.benchmarkGap,
  },
  null,
  2,
)}`;
}

export class WebsiteAuditAgent extends Agent<WebsiteAuditInput, WebsiteAuditOutput> {
  readonly name = "website_audit_agent";
  readonly description = "Scores a captured website against the standardized 100-point WLABS rubric.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = auditResultSchema;

  protected async execute(input: WebsiteAuditInput, ctx: AgentExecuteContext): Promise<WebsiteAuditOutput> {
    const draft = runAudit({
      data: input.extractedData,
      businessName: input.businessName,
      industryLabel: input.industryLabel,
      city: input.city,
      hasContact: input.hasContact,
    });

    if (isMockProvider()) return draft;

    const aiCritique = await generateStructured({
      system: AI_SYSTEM_PROMPT,
      prompt: buildAiPrompt(input, draft),
      schema: aiCritiqueSchema,
    });

    if (!aiCritique) {
      ctx.log("warn", "AI audit critique unavailable, using template output");
      return draft;
    }

    ctx.log("info", "Enhanced audit critique with AI");
    return { ...draft, ...aiCritique };
  }
}

export const websiteAuditAgent = new WebsiteAuditAgent();
