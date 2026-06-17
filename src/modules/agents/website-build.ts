/**
 * Post-payment pipeline orchestration.
 *
 * `runFullWebsiteBuild` — stub for the eventual build pipeline, called via
 * `after()` for warm leads that already have a preview.
 *
 * `onPublicPaymentSettled` — used by the public checkout (cold buyers):
 * runs qualify→crawl→audit then preview+wireframe generation before handing
 * off to the build stub. A blocked crawl is non-fatal; the lead lands in the
 * admin queue for manual enrichment.
 */
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/modules/crm/activity";

import { runLeadPipeline } from "./lead-pipeline";
import { runPreviewGeneration } from "./preview-pipeline";

export async function runFullWebsiteBuild(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { paymentStatus: true, businessName: true },
  });

  if (!lead || lead.paymentStatus !== "paid") return;

  await logActivity(
    leadId,
    "website_build_queued",
    "Full-stack website build queued following payment confirmation. Build pipeline pending implementation.",
  );
}

/**
 * Post-payment handler for public (cold-buyer) checkout.
 * Runs the full pipeline only when the lead has no successful capture/preview
 * yet — avoids re-running for leads that already went through the warm path.
 */
export async function onPublicPaymentSettled(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { paymentStatus: true },
  });
  if (!lead || lead.paymentStatus !== "paid") return;

  const existingCapture = await prisma.websiteCapture.findFirst({
    where: { leadId, crawlStatus: "success" },
  });
  const existingPreview = await prisma.preview.findFirst({ where: { leadId } });

  if (!existingCapture) {
    try {
      await runLeadPipeline(leadId, { createdBy: "public_checkout" });
    } catch {
      // Crawl failure or qualification stop — leave for manual enrichment
    }
  }

  if (!existingPreview) {
    try {
      await runPreviewGeneration(leadId, { createdBy: "public_checkout" });
    } catch {
      // No capture available — lead waits in admin queue
    }
  }

  await runFullWebsiteBuild(leadId);
}
