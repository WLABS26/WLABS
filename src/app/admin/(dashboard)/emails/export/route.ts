import { buildApprovedEmailsCsv } from "@/modules/crm/export";

/**
 * Download approved outreach as CSV.
 * Protected by the admin proxy (all /admin/* routes require a valid session).
 */
export async function GET() {
  const csv = await buildApprovedEmailsCsv();
  const filename = `wlabs-approved-emails-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
