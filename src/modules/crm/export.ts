/**
 * CSV export for approved outreach.
 *
 * Exports approved email drafts (with their lead + preview details) so they can
 * be sent from a real mailbox. Export is rate-limited at the UI/auth layer and
 * only includes drafts a human has approved.
 */
import { prisma } from "@/lib/prisma";

const EXPORT_COLUMNS = [
  "businessName",
  "contactEmail",
  "contactPerson",
  "websiteUrl",
  "previewUrl",
  "auditScore",
  "subject",
  "emailBody",
  "status",
] as const;

/** Quote a CSV cell, escaping embedded quotes (RFC4180). */
function csvCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

/** Build a CSV string of approved (and later-stage) email drafts. */
export async function buildApprovedEmailsCsv(): Promise<string> {
  const drafts = await prisma.emailDraft.findMany({
    where: { status: { in: ["approved", "exported", "sent"] } },
    orderBy: { createdAt: "desc" },
    include: {
      lead: { include: { previews: { orderBy: { createdAt: "desc" }, take: 1 } } },
    },
  });

  const rows = drafts.map((draft) => {
    const preview = draft.lead.previews[0];
    const previewUrl = preview
      ? `${appUrl()}/preview/${preview.slug}${preview.token ? `?token=${preview.token}` : ""}`
      : "";
    return [
      draft.lead.businessName,
      draft.lead.contactEmail ?? "",
      draft.lead.contactPerson ?? "",
      draft.lead.websiteUrl ?? "",
      previewUrl,
      draft.lead.auditScore ?? "",
      draft.subject,
      draft.body,
      draft.status,
    ];
  });

  const lines = [EXPORT_COLUMNS.join(","), ...rows.map((row) => row.map(csvCell).join(","))];
  return lines.join("\r\n");
}

export async function countApprovedEmails(): Promise<number> {
  return prisma.emailDraft.count({ where: { status: { in: ["approved", "exported", "sent"] } } });
}
