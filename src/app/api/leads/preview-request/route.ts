import { NextResponse } from "next/server";

import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { previewRequestSchema } from "@/lib/validations";
import { processInboundLead } from "@/modules/lead-source/inbound";

/**
 * Website preview request form (homepage hero, pricing CTA, /contact page).
 * This is the primary inbound lead capture endpoint. It never sends any
 * outbound email itself - it only stores the request and creates/links a
 * Lead so it appears in the admin review queue.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`preview-request:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = previewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await processInboundLead({
      name: parsed.data.name,
      businessName: parsed.data.businessName,
      websiteUrl: parsed.data.websiteUrl,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      industry: parsed.data.industry,
      message: parsed.data.message || null,
      source: "website_preview_form",
    });

    if (result.status === "suppressed") {
      // Respond identically to "created" so we don't leak suppression-list
      // membership, but do not create a lead.
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, status: result.status });
  } catch (err) {
    console.error("[api/leads/preview-request] failed:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please email us directly in the meantime." },
      { status: 500 },
    );
  }
}
