import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { listEmailDrafts } from "@/modules/crm/review-queue";

export const metadata: Metadata = { title: "Email Drafts" };

const STATUS_VARIANTS: Record<string, "default" | "brand" | "success" | "warning" | "destructive"> = {
  draft: "default",
  needs_review: "warning",
  do_not_send: "destructive",
  approved: "success",
  exported: "brand",
  sent: "success",
};

const FILTERS = [
  { label: "All", value: "" },
  { label: "Needs review", value: "needs_review" },
  { label: "Approved", value: "approved" },
  { label: "Do not send", value: "do_not_send" },
];

interface EmailsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function EmailsPage({ searchParams }: EmailsPageProps) {
  const { status } = await searchParams;
  const drafts = await listEmailDrafts(status || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Email drafts</h1>
        <p className="mt-1 text-sm text-muted">
          Outreach drafts are never sent automatically — approve them here, then export and send manually.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value ? `/admin/emails?status=${filter.value}` : "/admin/emails"}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              (status ?? "") === filter.value
                ? "border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan"
                : "border-white/10 text-muted hover:text-white"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent>
          {drafts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No email drafts here.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>QC</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell>
                      <Link href={`/admin/leads/${draft.lead.slug}`} className="font-medium text-white hover:text-brand-cyan">
                        {draft.lead.businessName}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted">{draft.subject}</TableCell>
                    <TableCell className="text-muted">{draft.variant.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[draft.status] ?? "default"}>{draft.status.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-muted">{draft.qcStatus?.replace(/_/g, " ") ?? "—"}</TableCell>
                    <TableCell className="text-muted">{formatDateTime(draft.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
