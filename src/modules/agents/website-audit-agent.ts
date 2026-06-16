/**
 * Website Audit Agent.
 *
 * Wraps the deterministic audit engine (audit-engine/heuristics.ts) in the
 * agent contract: validated input in, validated 100-point audit out. The
 * scoring itself is signal-based and repeatable — the same site always yields
 * the same score. When a real AI provider is configured:
 *
 * 1. A text critique layer sharpens criticalFindings/bestPracticeComparison/
 *    benchmarkGap (template critique is the guaranteed fallback).
 * 2. If a screenshot URL is provided, a visual audit via Claude/GPT-4o Vision
 *    appends visual findings and sets visualScore (0–10).
 */
import { z } from "zod";

import { generateStructured } from "@/lib/ai/generate";
import { generateWithVision } from "@/lib/ai/vision";
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
  screenshotUrl: z.string().nullable().optional(),
});

export type WebsiteAuditInput = z.infer<typeof inputSchema>;
export type WebsiteAuditOutput = z.infer<typeof auditResultSchema>;

const aiCritiqueSchema = z.object({
  criticalFindings: z.array(z.string()).min(3).max(5),
  bestPracticeComparison: z.string(),
  benchmarkGap: z.string(),
});

const visualAuditSchema = z.object({
  visualScore: z.number().min(0).max(10),
  colorHarmony: z.string(),
  typography: z.string(),
  layoutBalance: z.string(),
  ctaVisibility: z.string(),
  firstImpressionFeedback: z.string(),
  criticalVisualIssues: z.array(z.string()).max(4),
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

const VISUAL_AUDIT_SYSTEM_PROMPT =
  "You are a senior UI/UX designer reviewing a screenshot of an SMB website. " +
  "Your job is to identify visual/aesthetic problems that hurt conversion, brand credibility, or user experience. " +
  "Be specific and honest — don't soften your critique. Focus on what a first-time visitor would feel. " +
  "Rate the overall visual quality on a 0-10 scale (5 = mediocre average SMB site, 8+ = genuinely good). " +
  "Respond with ONLY a JSON object — no markdown, no preamble:";

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

    // --- Text critique ---
    const aiCritique = await generateStructured({
      system: AI_SYSTEM_PROMPT,
      prompt: buildAiPrompt(input, draft),
      schema: aiCritiqueSchema,
    });

    const withCritique: WebsiteAuditOutput = aiCritique
      ? (() => { ctx.log("info", "Enhanced audit critique with AI"); return { ...draft, ...aiCritique }; })()
      : (() => { ctx.log("warn", "AI audit critique unavailable, using template output"); return draft; })();

    // --- Visual audit (requires screenshot) ---
    if (!input.screenshotUrl) return withCritique;

    const visualAudit = await generateWithVision({
      system: VISUAL_AUDIT_SYSTEM_PROMPT,
      prompt: `Business: ${input.businessName}, Industry: ${input.industryLabel}.\n\nRate and describe the visual quality of this website homepage screenshot. Be specific about what you see.`,
      imageUrl: input.screenshotUrl,
      schema: visualAuditSchema,
    });

    if (!visualAudit) {
      ctx.log("warn", "Visual audit unavailable");
      return withCritique;
    }

    ctx.log("info", `Visual audit complete — score ${visualAudit.visualScore}/10`);

    // Merge visual findings: append visual issues to criticalFindings, prepend visual feedback to bestPracticeComparison
    const mergedCriticalFindings = [...withCritique.criticalFindings, ...visualAudit.criticalVisualIssues].slice(0, 7);
    const mergedComparison = `${visualAudit.firstImpressionFeedback} ${withCritique.bestPracticeComparison}`.trim();

    return {
      ...withCritique,
      criticalFindings: mergedCriticalFindings,
      bestPracticeComparison: mergedComparison,
      visualScore: visualAudit.visualScore,
      visualAuditJson: visualAudit as Record<string, unknown>,
    };
  }
}

export const websiteAuditAgent = new WebsiteAuditAgent();
