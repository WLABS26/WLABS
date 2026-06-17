import { NextResponse } from "next/server";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { intakeSubmissionSchema } from "@/lib/validations";
import { logActivity } from "@/modules/crm/activity";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Dynamic intake form submission, linked to a lead via its Preview slug.
 * Uses the same token-based access as the public preview page: unpublished
 * previews require a matching ?token / body token.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const ip = getClientIp(request);
  const limit = rateLimit(`intake:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { token, ...formData } = (body ?? {}) as { token?: string };

  const preview = await prisma.preview.findUnique({ where: { slug } });
  if (!preview || (preview.status !== "published" && preview.token && preview.token !== token)) {
    return NextResponse.json({ error: "Preview not found." }, { status: 404 });
  }

  const parsed = intakeSubmissionSchema.safeParse(formData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await prisma.intakeSubmission.create({
      data: {
        leadId: preview.leadId,
        targetCustomer: parsed.data.targetCustomer || null,
        brandColorsJson: (parsed.data.brandColors ?? []) as unknown as Prisma.InputJsonValue,
        preferredDomain: parsed.data.preferredDomain || null,
        additionalNotes: parsed.data.additionalNotes || null,
      },
    });

    await logActivity(preview.leadId, "intake_submitted", "Lead submitted the dynamic intake form.", { previewSlug: slug });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/intake] failed:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please email us directly in the meantime." },
      { status: 500 },
    );
  }
}
