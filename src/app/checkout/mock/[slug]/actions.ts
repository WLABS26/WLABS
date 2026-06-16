"use server";

import { redirect } from "next/navigation";

import { getPreviewBySlug } from "@/modules/generator/preview-store";
import { markLeadAsPaid } from "@/modules/payments/stripe";

/**
 * Completes the local mock checkout flow: marks the lead as paid via the
 * same `markLeadAsPaid()` helper the real Stripe webhook calls, then
 * redirects back to the preview with a success banner.
 */
export async function completeMockCheckoutAction(formData: FormData): Promise<void> {
  const slug = String(formData.get("previewSlug") ?? "");
  const token = formData.get("token") ? String(formData.get("token")) : null;

  const preview = await getPreviewBySlug(slug);
  if (!preview) {
    redirect("/");
  }

  await markLeadAsPaid(preview.lead.id, { checkoutSessionId: `mock_${preview.lead.id}_${Date.now()}` });

  const tokenParam = token ? `?token=${token}` : "";
  const separator = token ? "&" : "?";
  redirect(`/preview/${preview.slug}${tokenParam}${separator}payment=success`);
}
