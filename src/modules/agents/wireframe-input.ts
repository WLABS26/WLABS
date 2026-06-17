import type { Audit, Lead, WebsiteCapture } from "@/generated/prisma/client";
import { resolveWireframeImages } from "@/modules/generator/stock-images";
import { industryLabel } from "@/modules/generator/industry-templates";

import type { WireframeInput } from "./wireframe-generation-agent";

type ExtractedData = {
  addressHints?: string[];
  brandColors?: string[];
  fontFamily?: string | null;
  imageUrls?: string[];
};

/**
 * Rebuilds the WireframeInput from DB records — identical logic to
 * preview-pipeline.ts so refinement stays on the same palette/brand/images
 * as the original generation.
 */
export function buildWireframeInput(lead: Lead, capture: WebsiteCapture | null, audit: Audit | null): WireframeInput {
  const extracted = (capture?.extractedDataJson ?? null) as ExtractedData | null;
  const brandColors = extracted?.brandColors ?? [];

  const scrapedImages = extracted?.imageUrls ?? [];
  const wireframeImages = resolveWireframeImages(scrapedImages, lead.industry);

  const isGerman = ["de", "at", "ch", "germany", "austria", "switzerland", "deutschland", "österreich", "schweiz"].some(
    (c) => (lead.country ?? "").toLowerCase().includes(c),
  );

  return {
    businessName: lead.businessName,
    industry: lead.industry,
    industryLabel: industryLabel(lead.industry),
    city: lead.city ?? null,
    country: lead.country ?? null,
    contactPhone: lead.contactPhone ?? null,
    contactEmail: lead.contactEmail ?? null,
    websiteUrl: lead.websiteUrl ?? null,
    auditScore: audit?.overallScore ?? null,
    topIssues: (audit?.topIssuesJson as string[] | undefined) ?? [],
    criticalFindings: (audit?.criticalFindingsJson as string[] | undefined) ?? [],
    extractedTitle: capture?.title ?? null,
    extractedH1: capture?.h1 ?? null,
    extractedMetaDescription: capture?.metaDescription ?? null,
    extractedText: capture?.extractedText ? capture.extractedText.slice(0, 3000) : null,
    heroImageUrl: wireframeImages.heroImageUrl,
    philosophyImageUrl: wireframeImages.philosophyImageUrl,
    galleryImages: wireframeImages.galleryImages,
    brandColors,
    addressHint: extracted?.addressHints?.[0] ?? null,
    language: isGerman ? "de" : "en",
  };
}
