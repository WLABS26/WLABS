/**
 * WLABS shared domain types.
 *
 * These mirror the Prisma enums in prisma/schema.prisma but are declared
 * independently as plain TS unions so they can be safely imported from
 * client components, agents, and the audit engine without pulling in the
 * Prisma client runtime. Keep these in sync with the schema.
 */

import { INDUSTRIES } from "./constants";

export type IndustryKey = (typeof INDUSTRIES)[number]["value"];

// ----- CRM pipeline -----

export const LEAD_STATUSES = [
  "imported",
  "qualified",
  "rejected",
  "crawled",
  "audited",
  "high_opportunity",
  "medium_opportunity",
  "low_opportunity",
  "dedicated_sales",
  "preview_generated",
  "preview_qc_passed",
  "preview_needs_review",
  "email_drafted",
  "email_qc_passed",
  "approved",
  "contacted",
  "replied",
  "booked_call",
  "won",
  "lost",
  "suppressed",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_QUALIFICATIONS = ["ready_for_crawl", "needs_manual_review", "rejected"] as const;
export type LeadQualification = (typeof LEAD_QUALIFICATIONS)[number];

export const OPPORTUNITY_LEVELS = [
  "high_opportunity",
  "medium_opportunity",
  "low_opportunity",
  "reject",
] as const;
export type OpportunityLevel = (typeof OPPORTUNITY_LEVELS)[number];

// ----- Crawl / capture -----

export const CRAWL_STATUSES = ["pending", "success", "failed", "blocked", "timeout", "invalid_url"] as const;
export type CrawlStatus = (typeof CRAWL_STATUSES)[number];

// ----- QC -----

export const QC_STATUSES = ["passed", "needs_review", "failed"] as const;
export type QcStatus = (typeof QC_STATUSES)[number];

// ----- Preview -----

export const PREVIEW_STATUSES = ["draft", "generated", "needs_review", "approved", "published"] as const;
export type PreviewStatus = (typeof PREVIEW_STATUSES)[number];

// ----- Email -----

export const EMAIL_STATUSES = [
  "draft",
  "needs_review",
  "do_not_send",
  "approved",
  "exported",
  "sent",
  "bounced",
  "opted_out",
] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

export const EMAIL_VARIANTS = [
  "direct_preview",
  "audit_first",
  "soft_consult",
  "follow_up_1",
  "follow_up_2",
  "breakup",
] as const;
export type EmailVariant = (typeof EMAIL_VARIANTS)[number];

// ----- Inbound requests -----

export const INBOUND_REQUEST_STATUSES = ["new", "processing", "converted", "closed"] as const;
export type InboundRequestStatus = (typeof INBOUND_REQUEST_STATUSES)[number];

// ----- Workflow engine -----

export const WORKFLOW_RUN_STATUSES = [
  "pending",
  "running",
  "waiting_for_approval",
  "completed",
  "failed",
  "cancelled",
  "paused",
] as const;
export type WorkflowRunStatus = (typeof WORKFLOW_RUN_STATUSES)[number];

export const AGENT_STEP_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
  "waiting_for_approval",
  "retrying",
] as const;
export type AgentStepStatus = (typeof AGENT_STEP_STATUSES)[number];

// =========================================================
// Standardized 100-point Website Audit rubric
// =========================================================

export interface AuditCategoryDef {
  key: AuditCategoryKey;
  label: string;
  maxPoints: number;
  criteria: readonly string[];
}

export type AuditCategoryKey =
  | "firstImpression"
  | "mobileExperience"
  | "conversionReadiness"
  | "contentClarity"
  | "trustAndProof"
  | "technicalBasics"
  | "localBusinessSignals";

export const AUDIT_CATEGORIES: readonly AuditCategoryDef[] = [
  {
    key: "firstImpression",
    label: "First Impression & Visual Trust",
    maxPoints: 20,
    criteria: [
      "Modern visual design",
      "Clear hierarchy",
      "Professional spacing",
      "Consistent colors",
      "High-quality imagery",
      "Immediate credibility",
      "No outdated stock-photo look",
    ],
  },
  {
    key: "mobileExperience",
    label: "Mobile Experience",
    maxPoints: 15,
    criteria: [
      "Responsive layout",
      "CTA visible on mobile",
      "Tap targets usable",
      "Text readable",
      "Mobile navigation clear",
    ],
  },
  {
    key: "conversionReadiness",
    label: "Conversion Readiness",
    maxPoints: 20,
    criteria: [
      "Clear primary CTA",
      "Contact form visible",
      "Phone/email easy to find",
      "Above-the-fold value proposition",
      "Trust signals near CTA",
      "Location/service area visible",
      "Fast route to booking/contact",
    ],
  },
  {
    key: "contentClarity",
    label: "Content Clarity",
    maxPoints: 15,
    criteria: [
      "Clear headline",
      "Clear explanation of services",
      "Benefit-driven copy",
      "No vague generic claims",
      "Business-specific relevance",
      "Strong section structure",
    ],
  },
  {
    key: "trustAndProof",
    label: "Trust & Proof",
    maxPoints: 10,
    criteria: [
      "Reviews/testimonials",
      "Certifications/credentials",
      "Team/about section",
      "Real photos",
      "Case studies/projects",
      "Awards or affiliations",
    ],
  },
  {
    key: "technicalBasics",
    label: "Technical Basics",
    maxPoints: 10,
    criteria: ["HTTPS", "SEO title", "Meta description", "H1", "Load speed", "No obvious broken layout"],
  },
  {
    key: "localBusinessSignals",
    label: "Local Business Signals",
    maxPoints: 10,
    criteria: [
      "Address visible",
      "Google Maps embedded or linked",
      "Opening hours",
      "Local keywords",
      "Service area",
      "Local contact method",
    ],
  },
] as const;

export const AUDIT_TOTAL_POINTS = AUDIT_CATEGORIES.reduce((sum, c) => sum + c.maxPoints, 0);

export type CategoryScores = Record<AuditCategoryKey, number>;
