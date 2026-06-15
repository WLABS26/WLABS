/**
 * Structured content + theme for a generated preview homepage.
 *
 * The Preview Generation Agent produces a PreviewContent object (stored as
 * Preview.contentJson) and a PreviewTheme (Preview.themeJson). The dynamic
 * preview route renders these into a full MVP homepage. Keeping this strongly
 * typed lets the renderer stay simple and safe.
 */
import type { VisualStyle } from "./industry-templates";

export type CtaType = "form" | "phone" | "booking" | "link";

export interface PreviewCta {
  label: string;
  type: CtaType;
  /** For phone CTAs, the tel: target; for link/booking, the href. */
  value?: string;
}

export interface PreviewContent {
  meta: {
    businessName: string;
    industry: string;
    industryLabel: string;
    city: string | null;
    tagline: string;
  };
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    primaryCta: PreviewCta;
    secondaryCta: PreviewCta;
    trustCue: string;
  };
  problem: {
    heading: string;
    points: string[];
  };
  services: {
    heading: string;
    intro: string;
    items: { title: string; description: string }[];
  };
  whyUs: {
    heading: string;
    reasons: { title: string; description: string }[];
  };
  trust: {
    heading: string;
    /** Honest note explaining these are neutral placeholders unless real proof exists. */
    note: string;
    items: string[];
  };
  local: {
    heading: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    hours: string | null;
    serviceArea: string | null;
    showMap: boolean;
  };
  contact: {
    heading: string;
    subheading: string;
    fields: string[];
  };
  finalCta: {
    heading: string;
    subheading: string;
    cta: PreviewCta;
  };
}

export interface PreviewTheme {
  from: string;
  to: string;
  visualStyle: VisualStyle;
  /** Brand font family extracted from the lead's site, if any. */
  fontFamily: string | null;
}

/** Audit before/after summary surfaced on the preview as a callout. */
export interface PreviewAuditSummary {
  overallScore: number | null;
  topIssues: string[];
  redesignPotential: string | null;
}
