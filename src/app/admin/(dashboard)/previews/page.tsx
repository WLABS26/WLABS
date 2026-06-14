import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { listPreviews } from "@/modules/generator/preview-store";

export const metadata: Metadata = { title: "Previews" };

const PREVIEW_STATUS_VARIANTS: Record<string, "default" | "brand" | "success" | "warning"> = {
  draft: "default",
  generated: "brand",
  needs_review: "warning",
  approved: "success",
  published: "success",
};

export default async function PreviewsPage() {
  const previews = await listPreviews();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Previews</h1>
        <p className="mt-1 text-sm text-muted">Generated MVP homepage concepts and their engagement.</p>
      </div>

      <Card>
        <CardContent>
          {previews.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No previews yet. Generate one from a lead&apos;s detail page.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>QC</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>CTA clicks</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {previews.map((preview) => (
                  <TableRow key={preview.id}>
                    <TableCell>
                      <Link href={`/admin/leads/${preview.lead.slug}`} className="font-medium text-white hover:text-brand-cyan">
                        {preview.lead.businessName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={PREVIEW_STATUS_VARIANTS[preview.status] ?? "default"}>
                        {preview.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted">{preview.qcStatus?.replace(/_/g, " ") ?? "—"}</TableCell>
                    <TableCell className="text-muted">{preview.viewCount}</TableCell>
                    <TableCell className="text-muted">{preview.ctaClickCount}</TableCell>
                    <TableCell className="text-muted">{formatDateTime(preview.createdAt)}</TableCell>
                    <TableCell>
                      <a
                        href={`/preview/${preview.slug}${preview.token ? `?token=${preview.token}` : ""}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-brand-cyan hover:underline"
                      >
                        <Eye className="size-3.5" />
                        View
                        <ExternalLink className="size-3" />
                      </a>
                    </TableCell>
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
