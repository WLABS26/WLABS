import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createCheckoutSession, isStripeConfigured } from "@/modules/payments/stripe";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Starts checkout for a lead's Website MVP from a preview's "Claim this
 * website" CTA. Redirects to Stripe Checkout when configured, otherwise to
 * the local `/checkout/mock/[slug]` flow. Keyed on Preview.slug, using the
 * same token-based access rule as the public preview page.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const token = new URL(request.url).searchParams.get("token");

  const ip = getClientIp(request);
  const limit = rateLimit(`checkout:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  const preview = await prisma.preview.findUnique({ where: { slug }, include: { lead: true } });
  if (!preview || (preview.status !== "published" && preview.token && preview.token !== token)) {
    return NextResponse.json({ error: "Preview not found." }, { status: 404 });
  }

  if (!isStripeConfigured()) {
    const tokenParam = preview.token ? `?token=${preview.token}` : "";
    return NextResponse.redirect(new URL(`/checkout/mock/${slug}${tokenParam}`, request.url));
  }

  try {
    const checkoutUrl = await createCheckoutSession({
      leadId: preview.leadId,
      businessName: preview.lead.businessName,
      previewSlug: preview.slug,
      token: preview.token,
    });
    return NextResponse.redirect(checkoutUrl);
  } catch (err) {
    console.error("[api/checkout] failed:", err);
    return NextResponse.json({ error: "Could not start checkout. Please email us directly." }, { status: 500 });
  }
}
