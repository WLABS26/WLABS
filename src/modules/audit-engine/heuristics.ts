/**
 * WLABS audit scoring engine.
 *
 * Turns the crawler's ExtractedWebsiteData into a repeatable 100-point score
 * against the standardized rubric (AUDIT_CATEGORIES). Scoring is deterministic
 * and signal-based so the same site always yields the same score - this is the
 * objective audit the whole pipeline and sales process depends on. AI-written
 * narrative can later augment this, but the numbers come from here.
 */
import type { ExtractedWebsiteData } from "@/modules/crawler/extract";
import { AUDIT_CATEGORIES } from "@/modules/shared/types";
import type { AuditCategoryKey, CategoryScores, OpportunityLevel } from "@/modules/shared/types";

export interface AuditInput {
  data: ExtractedWebsiteData;
  businessName: string;
  industryLabel: string;
  city?: string | null;
  /** Whether we hold a usable business contact (email/phone) for outreach. */
  hasContact: boolean;
}

export interface AuditResult {
  overallScore: number;
  categoryScores: CategoryScores;
  topIssues: string[];
  quickWins: string[];
  recommendedPositioning: string;
  salesAngle: string;
  urgencyReason: string;
  redesignPotential: string;
  /** Harsher, specific UX/conversion problems - template default, AI-enhanced when configured. */
  criticalFindings: string[];
  /** 1-2 sentence comparison to best-practice sites in the same industry. */
  bestPracticeComparison: string;
  /** Qualitative gap vs. market benchmarks. */
  benchmarkGap: string;
  qualificationStatus: OpportunityLevel;
}

const MAX_BY_KEY = Object.fromEntries(AUDIT_CATEGORIES.map((c) => [c.key, c.maxPoints])) as Record<
  AuditCategoryKey,
  number
>;

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, Math.round(value)));

export function runAudit(input: AuditInput): AuditResult {
  const { data } = input;
  const corpus = [
    data.title,
    data.metaDescription,
    data.h1,
    ...data.headings,
    ...data.textSnippets,
    ...data.navLabels,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const has = (re: RegExp) => re.test(corpus);

  // ---- First Impression & Visual Trust (20) ----
  let firstImpression = 6;
  if (data.hasViewportMeta) firstImpression += 4;
  // A "modern" site needs real visual richness, not just a handful of images.
  if (data.imagesCount >= 6 && data.imagesCount <= 60) firstImpression += 3;
  else if (data.imagesCount >= 3) firstImpression += 1;
  else if (data.imagesCount === 0) firstImpression -= 3;
  if (data.hasFavicon) firstImpression += 2;
  if (data.title && data.metaDescription) firstImpression += 3;
  if (data.h1) firstImpression += 2;

  // ---- Mobile Experience (15) ----
  let mobileExperience = data.hasViewportMeta ? 9 : 2;
  if (data.hasPhone) mobileExperience += 3;
  if (data.ctaLabels.length > 0) mobileExperience += 3;

  // ---- Conversion Readiness (20) ----
  let conversionReadiness = 2;
  if (data.formsCount > 0) conversionReadiness += 5;
  if (data.hasPhone) conversionReadiness += 4;
  if (data.hasEmail) conversionReadiness += 3;
  if (data.ctaLabels.length >= 2) conversionReadiness += 4;
  else if (data.ctaLabels.length === 1) conversionReadiness += 2;
  if (data.h1) conversionReadiness += 2;

  // ---- Content Clarity (15) ----
  let contentClarity = 1;
  if (data.h1) contentClarity += 4;
  if (data.metaDescription) contentClarity += 3;
  if (data.textSnippets.length >= 3) contentClarity += 4;
  else if (data.textSnippets.length >= 1) contentClarity += 2;
  if (data.headings.length >= 3) contentClarity += 2;
  if (data.wordCount >= 150 && data.wordCount <= 3000) contentClarity += 1;
  else if (data.wordCount < 80) contentClarity -= 1;

  // ---- Trust & Proof (10) ----
  let trustAndProof = 1;
  if (has(/testimonial|review|rating|stars|google review/)) trustAndProof += 3;
  if (has(/certified|accredit|qualified|registered|licen[sc]ed|member of|award/)) trustAndProof += 2;
  if (has(/about us|our team|founded|years of|established|meet the/)) trustAndProof += 2;
  if (data.socialLinks.length > 0) trustAndProof += 1;
  if (data.imagesCount >= 5) trustAndProof += 1;
  if (data.hasPlaceholderContent) trustAndProof -= 2;

  // ---- Technical Basics (10) ----
  let technicalBasics = 0;
  if (data.https) technicalBasics += 3;
  if (data.title) technicalBasics += 2;
  if (data.metaDescription) technicalBasics += 2;
  if (data.h1) technicalBasics += 2;
  if (data.hasViewportMeta) technicalBasics += 1;

  // ---- Local Business Signals (10) ----
  let localBusinessSignals = 0;
  if (data.addressHints.length > 0) localBusinessSignals += 3;
  if (data.hasMapEmbed) localBusinessSignals += 3;
  if (data.hasPhone) localBusinessSignals += 2;
  if (has(/opening hours|mon\b|monday|open today|hours of/)) localBusinessSignals += 1;
  if (input.city && corpus.includes(input.city.toLowerCase())) localBusinessSignals += 1;

  const categoryScores: CategoryScores = {
    firstImpression: clamp(firstImpression, MAX_BY_KEY.firstImpression),
    mobileExperience: clamp(mobileExperience, MAX_BY_KEY.mobileExperience),
    conversionReadiness: clamp(conversionReadiness, MAX_BY_KEY.conversionReadiness),
    contentClarity: clamp(contentClarity, MAX_BY_KEY.contentClarity),
    trustAndProof: clamp(trustAndProof, MAX_BY_KEY.trustAndProof),
    technicalBasics: clamp(technicalBasics, MAX_BY_KEY.technicalBasics),
    localBusinessSignals: clamp(localBusinessSignals, MAX_BY_KEY.localBusinessSignals),
  };

  const overallScore = AUDIT_CATEGORIES.reduce((sum, c) => sum + categoryScores[c.key], 0);

  const { topIssues, quickWins } = buildFindings(data, categoryScores);
  const qualificationStatus = determineOpportunity(overallScore, input.hasContact);

  return {
    overallScore,
    categoryScores,
    topIssues,
    quickWins,
    qualificationStatus,
    ...buildNarrative(input, overallScore, qualificationStatus),
    ...buildCritique(data, categoryScores, overallScore, input.industryLabel),
  };
}

/** Translate the weakest categories into concrete issues, plus specific quick wins. */
function buildFindings(
  data: ExtractedWebsiteData,
  scores: CategoryScores,
): { topIssues: string[]; quickWins: string[] } {
  const ISSUE_TEXT: Record<AuditCategoryKey, string> = {
    firstImpression: "The homepage looks dated and does not build immediate visual trust.",
    mobileExperience: "The site is not clearly optimised for mobile visitors.",
    conversionReadiness: "There is no clear, fast path for visitors to get in touch or convert.",
    contentClarity: "Messaging is unclear - it is hard to tell what is offered and why.",
    trustAndProof: "There are few trust signals (reviews, credentials, real photos).",
    technicalBasics: "Basic SEO/technical fundamentals are missing or incomplete.",
    localBusinessSignals: "Local signals (address, map, hours) are weak or missing.",
  };

  const gaps = AUDIT_CATEGORIES.map((c) => ({
    key: c.key,
    gap: c.maxPoints - scores[c.key],
    ratio: (c.maxPoints - scores[c.key]) / c.maxPoints,
  }))
    .filter((g) => g.ratio >= 0.3)
    .sort((a, b) => b.gap - a.gap);

  const topIssues = gaps.slice(0, 3).map((g) => ISSUE_TEXT[g.key]);
  if (topIssues.length === 0) topIssues.push("Only minor refinements needed - the site already covers the basics.");

  const quickWins: string[] = [];
  if (data.formsCount === 0) quickWins.push("Add a visible contact form above the fold.");
  if (!data.hasPhone) quickWins.push("Add a tap-to-call phone number in the header.");
  if (!data.hasViewportMeta) quickWins.push("Make the layout responsive for mobile devices.");
  if (!data.metaDescription) quickWins.push("Add an SEO title and meta description.");
  if (!data.hasMapEmbed && data.addressHints.length === 0) quickWins.push("Add a location/map and opening hours section.");
  if (data.ctaLabels.length === 0) quickWins.push("Add a clear primary call-to-action button.");
  if (quickWins.length === 0) quickWins.push("Tighten the hero headline to lead with the core benefit.");

  return { topIssues, quickWins: quickWins.slice(0, 4) };
}

/** Harsher, more specific framing of each category gap - used for criticalFindings. */
const CRITICAL_FINDING_TEXT: Record<AuditCategoryKey, string> = {
  firstImpression:
    "The homepage doesn't build credibility in the first few seconds - weak visuals, missing branding details, and a first impression that falls short of modern design standards.",
  mobileExperience:
    "The layout isn't clearly optimised for the majority of visitors who arrive on mobile - text, buttons, and forms likely need pinching or zooming to use.",
  conversionReadiness:
    "There's no obvious, low-friction next step for a visitor who's ready to act - calls-to-action are missing, buried, or unclear.",
  contentClarity:
    "A new visitor can't quickly tell what the business does, who it's for, or why to choose it - the messaging is generic or too thin.",
  trustAndProof:
    "There's little to reassure a stranger this is a real, reputable business - few or no reviews, credentials, team photos, or social proof.",
  technicalBasics:
    "Fundamental SEO and technical hygiene (HTTPS, titles, meta descriptions, headings) is incomplete, hurting search visibility and trust alike.",
  localBusinessSignals:
    "Local search signals (address, map, hours, service area) are weak or missing, making it harder for nearby customers to find and trust the business.",
};

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

/** Expanded, harsher critique - template default for criticalFindings/bestPracticeComparison/benchmarkGap. */
function buildCritique(
  data: ExtractedWebsiteData,
  scores: CategoryScores,
  overallScore: number,
  industryLabel: string,
): Pick<AuditResult, "criticalFindings" | "bestPracticeComparison" | "benchmarkGap"> {
  const gaps = AUDIT_CATEGORIES.map((c) => ({
    key: c.key,
    gap: c.maxPoints - scores[c.key],
    ratio: (c.maxPoints - scores[c.key]) / c.maxPoints,
  }))
    .filter((g) => g.ratio >= 0.25)
    .sort((a, b) => b.gap - a.gap);

  const findings = gaps.map((g) => CRITICAL_FINDING_TEXT[g.key]);
  if (data.hasPlaceholderContent) {
    findings.unshift("The site still contains unedited template or placeholder copy (or placeholder phone numbers) that was never replaced with real business content.");
  }
  if (findings.length === 0) {
    findings.push("Overall the site is functional but unremarkable - nothing stands out as a reason to choose this business over a nearby competitor.");
  }

  const criticalFindings = dedupe(findings).slice(0, 5);
  while (criticalFindings.length < 3) {
    criticalFindings.push("Minor polish opportunities remain across copy, imagery, and calls-to-action.");
  }

  const label = industryLabel.toLowerCase();
  const bestPracticeComparison =
    overallScore >= 75
      ? `Compared to the best ${label} websites, this site already covers most fundamentals - the remaining gap to best-in-class is mostly visual polish and content depth.`
      : overallScore >= 60
        ? `Best-practice ${label} websites combine a fast, mobile-first layout, clear service breakdowns, visible reviews, and one obvious call-to-action above the fold - this site is missing several of those.`
        : `Best-practice ${label} websites lead with a clear value proposition, strong visual trust signals, and a frictionless way to contact or book - this site falls well short on most of these.`;

  const benchmarkGap =
    overallScore >= 75
      ? "Minimal estimated gap to market benchmarks - most visitors likely get the information they need."
      : overallScore >= 60
        ? "A meaningful share of visitors likely leave without making contact due to unclear messaging or a weak call-to-action - a focused redesign would close much of this gap."
        : "A large share of visitors likely bounce before finding what they need or how to get in touch - this represents an ongoing loss of enquiries compared to better-presented competitors.";

  return { criticalFindings, bestPracticeComparison, benchmarkGap };
}

/** Opportunity thresholds per docs/scoring-rubric.md. */
export function determineOpportunity(score: number, hasContact: boolean): OpportunityLevel {
  if (!hasContact) return "reject";
  if (score < 60) return "high_opportunity";
  if (score <= 75) return "medium_opportunity";
  return "low_opportunity";
}

function buildNarrative(
  input: AuditInput,
  score: number,
  level: OpportunityLevel,
): Pick<AuditResult, "recommendedPositioning" | "salesAngle" | "urgencyReason" | "redesignPotential"> {
  const where = input.city ? `${input.city} and the surrounding area` : "their local area";
  const recommendedPositioning = `A modern, trustworthy ${input.industryLabel.toLowerCase()} serving ${where}.`;

  const salesAngle =
    level === "high_opportunity"
      ? `The current site scores ${score}/100 and is likely losing easy enquiries - a clean MVP redesign would lift conversion quickly.`
      : level === "medium_opportunity"
        ? `The site scores ${score}/100 with a solid base but clear conversion gaps a focused redesign would close.`
        : `The site already scores ${score}/100, so the upside from a redesign is limited for now.`;

  const urgencyReason =
    level === "low_opportunity"
      ? "No urgent issues - revisit only if priorities change."
      : "Most customers judge a business by its website first; the current gaps cost trust and enquiries every week.";

  const redesignPotential =
    level === "high_opportunity"
      ? "High - strong upside from a modern, conversion-led MVP homepage."
      : level === "medium_opportunity"
        ? "Medium - targeted fixes to messaging and conversion paths would help."
        : "Low - the site is already reasonably modern.";

  return { recommendedPositioning, salesAngle, urgencyReason, redesignPotential };
}
