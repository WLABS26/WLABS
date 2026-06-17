import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * Serves the AI-generated wireframe HTML for a preview.
 * Performs the same token-gate check as the main preview page.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const preview = await prisma.preview.findUnique({
    where: { slug },
    select: { status: true, token: true, wireframeHtml: true },
  });

  if (!preview) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (preview.status !== "published" && preview.token && preview.token !== token) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  if (!preview.wireframeHtml) {
    return new NextResponse("Wireframe not yet generated", { status: 404 });
  }

  return new NextResponse(preview.wireframeHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-cache",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
