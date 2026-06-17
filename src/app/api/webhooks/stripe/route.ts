import { after } from "next/server";
import { NextResponse } from "next/server";

import { constructWebhookEvent, markLeadAsPaid } from "@/modules/payments/stripe";
import { onPublicPaymentSettled, runFullWebsiteBuild } from "@/modules/agents/website-build";

/**
 * Stripe webhook handler. Verifies the signature and marks the lead as paid
 * on `checkout.session.completed`. The local mock checkout flow
 * (`/checkout/mock/[slug]`) calls `markLeadAsPaid()` directly and never hits
 * this route.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event;
  try {
    event = constructWebhookEvent(payload, signature);
  } catch (err) {
    console.error("[api/webhooks/stripe] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const leadId = session.client_reference_id ?? session.metadata?.leadId ?? null;
    if (leadId) {
      await markLeadAsPaid(leadId, {
        stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
        checkoutSessionId: session.id,
      });
      const isPublicCheckout = session.metadata?.leadId && !session.metadata?.previewSlug;
      if (isPublicCheckout) {
        after(() => onPublicPaymentSettled(leadId));
      } else {
        after(() => runFullWebsiteBuild(leadId));
      }
    }
  }

  return NextResponse.json({ received: true });
}
