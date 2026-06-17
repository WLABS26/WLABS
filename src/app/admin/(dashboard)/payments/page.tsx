import type { Metadata } from "next";
import Link from "next/link";

import { AdminPagination } from "@/components/admin/pagination";
import { LeadStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { listLeads } from "@/modules/crm/leads";
import { INDUSTRIES } from "@/modules/shared/constants";

export const metadata: Metadata = {
  title: "Payments",
};

const INDUSTRY_LABELS = new Map<string, string>(INDUSTRIES.map((industry) => [industry.value, industry.label]));

interface PaymentsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) || 1 : 1;

  const { leads, total, totalPages } = await listLeads({
    paymentStatus: "paid",
    statusNotIn: ["won", "lost"],
    page,
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="mt-1 text-sm text-muted">
          {total} lead{total === 1 ? "" : "s"} paid for the Website MVP and awaiting delivery — jumps the queue in
          batch runs. Mark a lead &quot;Won&quot; once delivered to remove it from this list.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {leads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No paid leads awaiting delivery.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Pipeline status</TableHead>
                  <TableHead>Audit score</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Link href={`/admin/leads/${lead.slug}`} className="font-medium text-white hover:text-brand-cyan">
                        {lead.businessName}
                      </Link>
                      {lead.websiteUrl && <p className="max-w-[220px] truncate text-xs text-muted">{lead.websiteUrl}</p>}
                    </TableCell>
                    <TableCell className="text-muted">{INDUSTRY_LABELS.get(lead.industry) ?? lead.industry}</TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={lead.paymentStatus} />
                    </TableCell>
                    <TableCell>
                      <LeadStatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="text-white">{lead.auditScore !== null ? `${lead.auditScore} / 100` : "—"}</TableCell>
                    <TableCell className="text-muted">{formatDateTime(lead.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <AdminPagination page={page} totalPages={totalPages} basePath="/admin/payments" />
        </CardContent>
      </Card>
    </div>
  );
}
