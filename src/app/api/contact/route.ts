import { NextResponse } from "next/server";

import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { contactRequestSchema } from "@/lib/validations";
import { processInboundLead } from "@/modules/lead-source/inbound";

/**
 * General contact form (/contact page "Send message").
 * Always stores an InboundRequest. If a business name + website are
 * provided, also creates/links a Lead so it surfaces in the review queue.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`contact:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = contactRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await processInboundLead({
      name: parsed.data.name,
      businessName: parsed.data.businessName || null,
      websiteUrl: parsed.data.websiteUrl || null,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      industry: parsed.data.industry || null,
      message: parsed.data.message,
      source: "contact_form",
    });

    if (result.status === "suppressed") {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, status: result.status });
  } catch (err) {
    console.error("[api/contact] failed:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please email us directly in the meantime." },
      { status: 500 },
    );
  }
}
