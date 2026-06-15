import type { Metadata } from "next";
import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { ArrowRight } from "lucide-react";

import { Badge, badgeVariants } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import type { DiscoveryRunStatus } from "@/generated/prisma/client";
import { listLeads } from "@/modules/crm/leads";
import { getDiscoveredTodayCount, listDiscoveryRuns } from "@/modules/discovery/discovery-runs";
import { INDUSTRIES } from "@/modules/shared/constants";

import { ScopeMarketForm } from "./scope-market-form";

export const metadata: Metadata = {
  title: "Discovery",
};

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const INDUSTRY_LABELS = new Map<string, string>(INDUSTRIES.map((industry) => [industry.value, industry.label]));

const DISCOVERY_RUN_STATUS_VARIANTS: Record<DiscoveryRunStatus, BadgeVariant> = {
  discovering: "brand",
  processing: "warning",
  completed: "success",
  failed: "destructive",
};

const DAILY_CAP = Number(process.env.DISCOVERY_DAILY_CAP ?? 150);
const DEFAULT_TARGET = Number(process.env.DISCOVERY_DEFAULT_TARGET ?? 100);

export default async function AdminDiscoveryPage() {
  const [discoveredToday, runs, dedicatedSales] = await Promise.all([
    getDiscoveredTodayCount(),
    listDiscoveryRuns(),
    listLeads({ status: "dedicated_sales", pageSize: 1 }),
  ]);

  const remaining = Math.max(0, DAILY_CAP - discoveredToday);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Scope Market</h1>
        <p className="mt-1 text-sm text-muted">
          Search Google Places for local businesses, audit their websites, and import the weak ones into the redesign
          pipeline. Strong sites are routed to dedicated sales.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scope a new market</CardTitle>
          <CardDescription>
            {discoveredToday} / {DAILY_CAP} discovered today. Discovery and import run immediately below — the qualify →
            crawl → audit pipeline for new leads continues in the background.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScopeMarketForm defaultTarget={DEFAULT_TARGET} remaining={remaining} />
        </CardContent>
      </Card>

      {dedicatedSales.total > 0 && (
        <Link
          href="/admin/discovery/sales"
          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm transition-colors hover:bg-white/5"
        >
          <span className="text-white">
            {dedicatedSales.total} lead{dedicatedSales.total === 1 ? "" : "s"} awaiting dedicated-sales review
          </span>
          <ArrowRight className="size-4 text-muted" />
        </Link>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent runs</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No Scope Market runs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Found</TableHead>
                  <TableHead>Imported</TableHead>
                  <TableHead>Dedicated sales</TableHead>
                  <TableHead>Prospects</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <span className="font-medium text-white">{run.city}</span>
                      {run.country && <p className="text-xs text-muted">{run.country}</p>}
                    </TableCell>
                    <TableCell className="text-muted">
                      {run.industries.map((industry) => INDUSTRY_LABELS.get(industry) ?? industry).join(", ")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={DISCOVERY_RUN_STATUS_VARIANTS[run.status]}>{run.status.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-muted">{run.placesFound}</TableCell>
                    <TableCell className="text-muted">{run.imported}</TableCell>
                    <TableCell className="text-muted">{run.dedicatedSalesCount}</TableCell>
                    <TableCell className="text-muted">{run.prospectsCount}</TableCell>
                    <TableCell className="text-muted">{formatDateTime(run.createdAt)}</TableCell>
                    <TableCell className="text-muted">{run.completedAt ? formatDateTime(run.completedAt) : "—"}</TableCell>
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
