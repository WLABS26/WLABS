/**
 * Shared zod schemas for agent inputs/outputs.
 *
 * Kept separate so the crawler and audit-engine modules stay dependency-light
 * (no zod) while the agents that wrap them get full runtime validation.
 */
import { z } from "zod";

/** Mirrors crawler/extract.ts ExtractedWebsiteData. */
export const extractedWebsiteDataSchema = z.object({
  title: z.string().nullable(),
  metaDescription: z.string().nullable(),
  h1: z.string().nullable(),
  headings: z.array(z.string()),
  textSnippets: z.array(z.string()),
  navLabels: z.array(z.string()),
  ctaLabels: z.array(z.string()),
  emails: z.array(z.string()),
  phones: z.array(z.string()),
  socialLinks: z.array(z.string()),
  addressHints: z.array(z.string()),
  imagesCount: z.number(),
  imageUrls: z.array(z.string()).default([]),
  formsCount: z.number(),
  linksCount: z.number(),
  wordCount: z.number(),
  https: z.boolean(),
  hasViewportMeta: z.boolean(),
  hasSchemaOrg: z.boolean(),
  hasFavicon: z.boolean(),
  hasPhone: z.boolean(),
  hasEmail: z.boolean(),
  hasMapEmbed: z.boolean(),
  hasPlaceholderContent: z.boolean(),
  contactPerson: z.string().nullable(),
  imprintUrl: z.string().nullable(),
  faviconUrl: z.string().nullable(),
  themeColor: z.string().nullable(),
  brandColors: z.array(z.string()),
  fontFamily: z.string().nullable(),
});

export const categoryScoresSchema = z.object({
  firstImpression: z.number(),
  mobileExperience: z.number(),
  conversionReadiness: z.number(),
  contentClarity: z.number(),
  trustAndProof: z.number(),
  technicalBasics: z.number(),
  localBusinessSignals: z.number(),
});

export const auditResultSchema = z.object({
  overallScore: z.number(),
  categoryScores: categoryScoresSchema,
  topIssues: z.array(z.string()),
  quickWins: z.array(z.string()),
  recommendedPositioning: z.string(),
  salesAngle: z.string(),
  urgencyReason: z.string(),
  redesignPotential: z.string(),
  criticalFindings: z.array(z.string()),
  bestPracticeComparison: z.string(),
  benchmarkGap: z.string(),
  qualificationStatus: z.enum(["high_opportunity", "medium_opportunity", "low_opportunity", "reject"]),
  // Optional visual audit results (set when a screenshot is available and vision AI is configured)
  visualScore: z.number().min(0).max(10).nullable().optional(),
  visualAuditJson: z.record(z.string(), z.unknown()).nullable().optional(),
});
