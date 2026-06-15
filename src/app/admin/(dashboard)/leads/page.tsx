import type { Metadata } from "next";
import Link from "next/link";
import { Plus, RotateCcw, Upload } from "lucide-react";

import { LeadFilters } from "@/components/admin/lead-filters";
import { AdminPagination } from "@/components/admin/pagination";
import { LeadStatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { listLeads } from "@/modules/crm/leads";
import { INDUSTRIES } from "@/modules/shared/constants";
import { LEAD_STATUSES, type LeadStatus } from "@/modules/shared/types";

import { requeueLeadAction } from "../actions";
import { DeleteLeadButton } from "./delete-lead-button";

export const metadata: Metadata = {
  title: "Leads",
};

const INDUSTRY_LABELS = new Map<string, string>(INDUSTRIES.map((industry) => [industry.value, industry.label]));

/** Parse a (possibly comma-separated, e.g. from a dashboard funnel link) status filter. */
function parseLeadStatusFilter(value: string | undefined): LeadStatus[] | undefined {
  if (!value) return undefined;
  const statuses = value.split(",").filter((part): part is LeadStatus => (LEAD_STATUSES as readonly string[]).includes(part));
  return statuses.length > 0 ? statuses : undefined;
}

interface AdminLeadsPageProps {
  searchParams: Promise<{ status?: string; industry?: string; search?: string; page?: string }>;
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  const params = await searchParams;
  const statusParam = params.status || undefined;
  const status = parseLeadStatusFilter(statusParam);
  const industry = params.industry || undefined;
  const search = params.search || undefined;
  const page = params.page ? Number(params.page) || 1 : 1;

  const { leads, total, totalPages } = await listLeads({ status, industry, search, page });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="mt-1 text-sm text-muted">
            {total} lead{total === 1 ? "" : "s"} in the pipeline.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/leads/import">
              <Upload className="size-4" />
              Import CSV
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/leads/new">
              <Plus className="size-4" />
              New lead
            </Link>
          </Button>
        </div>
      </div>

      <LeadFilters status={statusParam} industry={industry} search={search} />

      <Card>
        <CardContent className="space-y-4">
          {leads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No leads match these filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-muted">
                      {lead.contactPerson && <p className="text-white">{lead.contactPerson}</p>}
                      {lead.contactEmail && <p className="text-xs">{lead.contactEmail}</p>}
                      {!lead.contactPerson && !lead.contactEmail && "—"}
                    </TableCell>
                    <TableCell>
                      <LeadStatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="text-muted">{formatDateTime(lead.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {lead.status === "rejected" && (
                          <form action={requeueLeadAction}>
                            <input type="hidden" name="leadId" value={lead.id} />
                            <Button
                              type="submit"
                              size="icon"
                              variant="ghost"
                              aria-label={`Queue ${lead.businessName} for re-review`}
                              title="Queue for re-review"
                              className="text-muted hover:text-brand-cyan"
                            >
                              <RotateCcw className="size-4" />
                            </Button>
                          </form>
                        )}
                        <DeleteLeadButton leadId={lead.id} businessName={lead.businessName} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <AdminPagination page={page} totalPages={totalPages} basePath="/admin/leads" searchParams={{ status: statusParam, industry, search }} />
        </CardContent>
      </Card>
    </div>
  );
}
