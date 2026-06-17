import { NextResponse } from "next/server";
import { z } from "zod";

import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { processInboundLead } from "@/modules/lead-source/inbound";
import { createLeadCheckoutSession, isStripeConfigured } from "@/modules/payments/stripe";
import { INDUSTRIES } from "@/modules/shared/constants";

const industryValues = INDUSTRIES.map((i) => i.value) as [string, ...string[]];

const schema = z.object({
  businessName: z.string().trim().min(2).max(160),
  websiteUrl: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : undefined)),
  email: z.string().trim().toLowerCase().email().max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  industry: z.enum(industryValues).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`checkout-start:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  }

  const { businessName, websiteUrl, email, phone, industry } = parsed.data;

  const result = await processInboundLead({
    name: businessName,
    businessName,
    websiteUrl: websiteUrl ?? null,
    email,
    phone: phone || null,
    industry: industry ?? null,
    source: "public_checkout",
  });

  if (result.status === "suppressed" || !result.leadId) {
    return NextResponse.json(
      { error: "We're unable to process this request. Please contact us directly." },
      { status: 422 },
    );
  }

  const leadId = result.leadId;

  if (!isStripeConfigured()) {
    return NextResponse.json({ url: `/checkout/mock/lead/${leadId}` });
  }

  try {
    const url = await createLeadCheckoutSession({ leadId, businessName });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[api/checkout/start] stripe error:", err);
    return NextResponse.json({ error: "Could not start checkout. Please email us directly." }, { status: 500 });
  }
}
