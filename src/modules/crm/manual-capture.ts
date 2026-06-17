import { prisma } from "@/lib/prisma";
import { logActivity } from "@/modules/crm/activity";

export interface ManualCaptureInput {
  title?: string | null;
  h1?: string | null;
  metaDescription?: string | null;
  aboutText?: string | null;
  addressHint?: string | null;
  brandColors?: string | null;
  fontFamily?: string | null;
  imageUrls?: string | null;
}

/**
 * Writes or updates a WebsiteCapture with crawlStatus "success" from
 * manually-entered content. The extractedDataJson is shaped like
 * ExtractedWebsiteData so the preview pipeline picks it up unchanged via
 * its findFirst({ crawlStatus: "success" }) query.
 */
export async function saveManualCapture(leadId: string, input: ManualCaptureInput): Promise<void> {
  const brandColors = input.brandColors
    ? input.brandColors
        .split(",")
        .map((c) => c.trim())
        .filter((c) => /^#[0-9a-fA-F]{3,8}$/.test(c))
    : [];

  const imageUrls = input.imageUrls
    ? input.imageUrls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean)
    : [];

  const extractedDataJson = {
    title: input.title ?? null,
    metaDescription: input.metaDescription ?? null,
    h1: input.h1 ?? null,
    textSnippets: input.aboutText ? [input.aboutText] : [],
    emails: [],
    phones: [],
    addressHints: input.addressHint ? [input.addressHint] : [],
    brandColors,
    fontFamily: input.fontFamily ?? null,
    imageUrls,
    links: [],
    contactPerson: null,
    imprintUrl: null,
    manualEntry: true,
  };

  const existing = await prisma.websiteCapture.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await prisma.websiteCapture.update({
      where: { id: existing.id },
      data: {
        crawlStatus: "success",
        title: input.title ?? null,
        h1: input.h1 ?? null,
        metaDescription: input.metaDescription ?? null,
        extractedText: input.aboutText ?? null,
        extractedDataJson,
        errorMessage: null,
      },
    });
  } else {
    await prisma.websiteCapture.create({
      data: {
        leadId,
        crawlStatus: "success",
        title: input.title ?? null,
        h1: input.h1 ?? null,
        metaDescription: input.metaDescription ?? null,
        extractedText: input.aboutText ?? null,
        extractedDataJson,
      },
    });
  }

  await logActivity(leadId, "manual_capture_saved", "Website content saved manually — pipeline unblocked for preview generation.");
}
