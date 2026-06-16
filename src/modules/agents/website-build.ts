/**
 * Post-payment full-stack website build pipeline (stub).
 *
 * Called via `after()` after payment is confirmed. Currently logs the trigger
 * and marks the lead accordingly — the actual production build implementation
 * is a future sprint once the wireframe → approval → payment flow is validated.
 */
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/modules/crm/activity";

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
