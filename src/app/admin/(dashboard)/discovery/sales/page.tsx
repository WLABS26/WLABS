import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AdminPagination } from "@/components/admin/pagination";
import { LeadStatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { listLeads } from "@/modules/crm/leads";
import { INDUSTRIES } from "@/modules/shared/constants";

export const metadata: Metadata = {
  title: "Dedicated Sales",
};

const INDUSTRY_LABELS = new Map<string, string>(INDUSTRIES.map((industry) => [industry.value, industry.label]));

interface DiscoverySalesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function DiscoverySalesPage({ searchParams }: DiscoverySalesPageProps) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) || 1 : 1;

  const { leads, total, totalPages } = await listLeads({
    status: "dedicated_sales",
    page,
    orderBy: { auditScore: "desc" },
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/discovery" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
        <ArrowLeft className="size-4" />
        Back to discovery
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Dedicated sales</h1>
        <p className="mt-1 text-sm text-muted">
          {total} discovery-sourced lead{total === 1 ? "" : "s"} with a strong existing website — a different pitch than
          the redesign pipeline.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {leads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No leads awaiting dedicated-sales review.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Audit score</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Discovered</TableHead>
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
                    <TableCell className="text-white">{lead.auditScore !== null ? `${lead.auditScore} / 100` : "—"}</TableCell>
                    <TableCell className="text-muted">
                      {lead.contactPerson && <p className="text-white">{lead.contactPerson}</p>}
                      {lead.contactEmail && <p className="text-xs">{lead.contactEmail}</p>}
                      {lead.contactPhone && <p className="text-xs">{lead.contactPhone}</p>}
                      {!lead.contactPerson && !lead.contactEmail && !lead.contactPhone && "—"}
                    </TableCell>
                    <TableCell>
                      <LeadStatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="text-muted">{formatDateTime(lead.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <AdminPagination page={page} totalPages={totalPages} basePath="/admin/discovery/sales" />
        </CardContent>
      </Card>
    </div>
  );
}
