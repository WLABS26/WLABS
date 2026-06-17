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

/** Fetch a lead's most recent preview (slug + token), for building share/intake links. */
export async function getLatestPreviewForLead(leadId: string) {
  return prisma.preview.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
    select: { slug: true, token: true },
  });
}

/** Build the public intake-form URL for a preview, including its access token if set. */
export function buildIntakeUrl(slug: string, token: string | null): string {
  return token ? `/intake/${slug}?token=${token}` : `/intake/${slug}`;
}

/** List previews for the admin preview manager, newest first. */
export async function listPreviews() {
  return prisma.preview.findMany({
    orderBy: { createdAt: "desc" },
    include: { lead: { select: { businessName: true, slug: true, industry: true } } },
  });
}

export type PreviewListItem = Awaited<ReturnType<typeof listPreviews>>[number];
