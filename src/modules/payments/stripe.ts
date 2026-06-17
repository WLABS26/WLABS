/**
 * Stripe payments module.
 *
 * Wraps Stripe Checkout for the fixed-price Website MVP (`PRICING.mvp`). When
 * `STRIPE_SECRET_KEY` is not configured, `isStripeConfigured()` returns false
 * and callers fall back to the local `/checkout/mock/[slug]` flow so the paid
 * pipeline can still be exercised end-to-end - same philosophy as
 * `AI_PROVIDER="mock"` and the Scope Market Places API fixtures.
 *
 * `markLeadAsPaid()` is the single source of truth for transitioning a lead's
 * `paymentStatus` to `paid` - both the real Stripe webhook handler and the
 * local mock-checkout server action call it, so payment-status logic never
 * needs to be duplicated.
 */
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/modules/crm/activity";
import { PRICING } from "@/modules/shared/constants";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let cachedClient: Stripe | undefined;

function getStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  if (!cachedClient) {
    cachedClient = new Stripe(apiKey);
  }
  return cachedClient;
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export interface CreateCheckoutSessionParams {
  leadId: string;
  businessName: string;
  previewSlug: string;
  token: string | null;
}

/**
 * Create a Stripe Checkout Session for the Website MVP and record that
 * checkout has started. Returns the hosted Checkout URL to redirect to.
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<string> {
  const stripe = getStripeClient();
  const returnPath = `/preview/${params.previewSlug}${params.token ? `?token=${params.token}` : ""}`;
  const separator = params.token ? "&" : "?";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: params.leadId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: PRICING.mvp.currency.toLowerCase(),
          unit_amount: PRICING.mvp.price * 100,
          product_data: {
            name: `${PRICING.mvp.name} — ${params.businessName}`,
            description: `Fixed-price redesign for ${params.businessName} (${PRICING.mvp.turnaround}).`,
          },
        },
      },
    ],
    success_url: `${appUrl()}${returnPath}${separator}payment=success`,
    cancel_url: `${appUrl()}${returnPath}${separator}payment=cancelled`,
    metadata: { leadId: params.leadId, previewSlug: params.previewSlug },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  await markCheckoutStarted(params.leadId, session.id);

  return session.url;
}

/** Record that a lead has started checkout (moves paymentStatus to "pending"). */
export async function markCheckoutStarted(leadId: string, checkoutSessionId: string): Promise<void> {
  await prisma.lead.update({
    where: { id: leadId },
    data: { paymentStatus: "pending", stripeCheckoutSessionId: checkoutSessionId },
  });
  await logActivity(leadId, "checkout_started", "Lead started checkout for the Website MVP.", { checkoutSessionId });
}

export interface MarkLeadAsPaidDetails {
  stripeCustomerId?: string | null;
  checkoutSessionId?: string | null;
}

/**
 * Mark a lead as paid. Single source of truth for the `paid` transition -
 * called by both the Stripe webhook handler and the local mock checkout.
 * Idempotent: a no-op if the lead is already `paid`.
 */
export async function markLeadAsPaid(leadId: string, details?: MarkLeadAsPaidDetails): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { paymentStatus: true } });
  if (!lead || lead.paymentStatus === "paid") return;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      paymentStatus: "paid",
      ...(details?.stripeCustomerId ? { stripeCustomerId: details.stripeCustomerId } : {}),
      ...(details?.checkoutSessionId ? { stripeCheckoutSessionId: details.checkoutSessionId } : {}),
    },
  });

  await logActivity(
    leadId,
    "payment_received",
    "Payment received for the Website MVP — moved to the priority queue.",
  );
}

export interface CreateLeadCheckoutSessionParams {
  leadId: string;
  businessName: string;
}

/**
 * Create a Stripe Checkout Session keyed on a Lead (not a Preview).
 * Used by the public /checkout page for cold buyers who haven't seen a preview.
 */
export async function createLeadCheckoutSession(params: CreateLeadCheckoutSessionParams): Promise<string> {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: params.leadId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: PRICING.mvp.currency.toLowerCase(),
          unit_amount: PRICING.mvp.price * 100,
          product_data: {
            name: `${PRICING.mvp.name} — ${params.businessName}`,
            description: `Fixed-price website redesign for ${params.businessName} (${PRICING.mvp.turnaround}).`,
          },
        },
      },
    ],
    success_url: `${appUrl()}/checkout/success?lead=${params.leadId}`,
    cancel_url: `${appUrl()}/pricing`,
    metadata: { leadId: params.leadId },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  await markCheckoutStarted(params.leadId, session.id);
  return session.url;
}

/** Verify and parse a Stripe webhook payload using STRIPE_WEBHOOK_SECRET. */
export function constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return getStripeClient().webhooks.constructEvent(payload, signature, secret);
}
