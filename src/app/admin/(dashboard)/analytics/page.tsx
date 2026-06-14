import type { Metadata } from "next";
import { Eye, MousePointerClick, PhoneCall, Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEur } from "@/lib/utils";
import { getAnalytics } from "@/modules/crm/analytics";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const a = await getAnalytics();

  const funnel: { label: string; value: number }[] = [
    { label: "Crawl success rate", value: a.crawlSuccessRate },
    { label: "Audit completion rate", value: a.auditCompletionRate },
    { label: "Preview generation rate", value: a.previewGenerationRate },
    { label: "Preview QC pass rate", value: a.previewQcPassRate },
    { label: "Email draft rate", value: a.emailDraftRate },
    { label: "Email approval rate", value: a.emailApprovalRate },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-muted">Funnel performance and the estimated revenue pipeline.</p>
      </div>

      {/* Revenue + engagement */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Revenue won" value={formatEur(a.revenue)} icon={<Trophy className="size-4" />} accent />
        <Metric label="Pipeline value" value={formatEur(a.pipelineValue)} icon={<PhoneCall className="size-4" />} />
        <Metric label="Preview views" value={String(a.previewViews)} icon={<Eye className="size-4" />} />
        <Metric label="CTA clicks" value={String(a.ctaClicks)} icon={<MousePointerClick className="size-4" />} />
      </div>

      {/* Funnel rates */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline conversion rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {funnel.map((row) => (
            <div key={row.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{row.label}</span>
                <span className="font-medium text-white">{row.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${Math.min(100, row.value)}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Outcomes */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Total leads" value={String(a.totalLeads)} />
        <Metric label="Qualified" value={String(a.qualifiedLeads)} />
        <Metric label="Contacted" value={String(a.contacted)} />
        <Metric label="Replied" value={String(a.replied)} />
        <Metric label="Booked calls" value={String(a.bookedCalls)} />
        <Metric label="Won" value={String(a.won)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estimated conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            Win rate (won / contacted outcomes): <span className="font-semibold text-white">{a.conversionRate}%</span>.
            Based on a fixed MVP price of {formatEur(a.revenue / Math.max(1, a.won) || 0)} per win.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-brand-cyan/40 bg-brand-cyan/5" : "border-white/10 bg-white/[0.02]"}`}>
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
