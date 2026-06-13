import { prisma } from "@/lib/prisma";
import { normalizeEmail, normalizeWebsiteUrl } from "@/modules/lead-source/normalize";

/**
 * Check the Suppression list (GDPR/ePrivacy "do not contact" register).
 * Matches on normalized email OR normalized website URL.
 * Returns the matching Suppression record, or null if not suppressed.
 */
export async function checkSuppression(input: { email?: string | null; websiteUrl?: string | null }) {
  const email = input.email ? normalizeEmail(input.email) : undefined;
  const websiteUrl = input.websiteUrl ? normalizeWebsiteUrl(input.websiteUrl) : undefined;

  if (!email && !websiteUrl) return null;

  const conditions = [];
  if (email) conditions.push({ email });
  if (websiteUrl) conditions.push({ websiteUrl });

  return prisma.suppression.findFirst({ where: { OR: conditions } });
}

/** Add an entry to the suppression list (e.g. on "no thanks" / opt-out / manual suppression). */
export async function addSuppression(input: { email?: string | null; websiteUrl?: string | null; reason: string }) {
  return prisma.suppression.create({
    data: {
      email: input.email ? normalizeEmail(input.email) : null,
      websiteUrl: input.websiteUrl ? normalizeWebsiteUrl(input.websiteUrl) : null,
      reason: input.reason,
    },
  });
}
