/**
 * Preview persistence helpers for the public renderer and admin preview manager.
 */
import { prisma } from "@/lib/prisma";

/** Fetch a preview by slug with its lead and latest audit (for the before/after callout). */
export async function getPreviewBySlug(slug: string) {
  return prisma.preview.findUnique({
    where: { slug },
    include: {
      lead: {
        include: { audits: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
}

export type PreviewWithLead = NonNullable<Awaited<ReturnType<typeof getPreviewBySlug>>>;

/** Increment a preview's view counter (best-effort analytics; never blocks render). */
export async function recordPreviewView(id: string): Promise<void> {
  try {
    await prisma.preview.update({ where: { id }, data: { viewCount: { increment: 1 } } });
  } catch {
    // analytics only - ignore failures
  }
}

/** List previews for the admin preview manager, newest first. */
export async function listPreviews() {
  return prisma.preview.findMany({
    orderBy: { createdAt: "desc" },
    include: { lead: { select: { businessName: true, slug: true, industry: true } } },
  });
}

export type PreviewListItem = Awaited<ReturnType<typeof listPreviews>>[number];
