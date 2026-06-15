import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Award, ExternalLink, Eye, Flame, Mail, Phone, RefreshCw, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReviewQueue } from "@/modules/crm/review-queue";

import {
  approveEmailAction,
  approvePreviewAction,
  markContactedAction,
  rejectEmailAction,
  retryLeadPipelineAction,
  runPreviewQcAction,
} from "../actions";

export const metadata: Metadata = { title: "Review Queue" };

export default async function ReviewQueuePage() {
  const queue = await getReviewQueue();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Review queue</h1>
        <p className="mt-1 text-sm text-muted">Everything waiting on a human decision.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Previews" value={queue.totals.previews} icon={<Eye className="size-4" />} />
        <StatCard label="Emails" value={queue.totals.emails} icon={<Mail className="size-4" />} />
        <StatCard label="Failed steps" value={queue.totals.failed} icon={<XCircle className="size-4" />} />
        <StatCard label="High opp." value={queue.totals.highOpportunity} icon={<Flame className="size-4" />} />
        <StatCard label="Dedicated sales" value={queue.totals.dedicatedSales} icon={<Award className="size-4" />} />
        <StatCard label="Compliance" value={queue.totals.compliance} icon={<AlertCircle className="size-4" />} />
      </div>

      {/* Previews needing review */}
      <Card>
        <CardHeader>
          <CardTitle>Previews needing review</CardTitle>
          <CardDescription>Approve to mark client-ready, run QC for an automated check, or open to inspect.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {queue.previewsNeedingReview.length === 0 ? (
            <Empty>No previews need review.</Empty>
          ) : (
            queue.previewsNeedingReview.map((preview) => (
              <div key={preview.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3">
                <div>
                  <Link href={`/admin/leads/${preview.lead.slug}`} className="font-medium text-white hover:text-brand-cyan">
                    {preview.lead.businessName}
                  </Link>
                  {preview.qcStatus && <Badge variant="outline" className="ml-2">QC: {preview.qcStatus.replace(/_/g, " ")}</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/preview/${preview.slug}${preview.token ? `?token=${preview.token}` : ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-brand-cyan hover:underline"
                  >
                    <Eye className="size-3.5" /> View <ExternalLink className="size-3" />
                  </a>
                  <form action={runPreviewQcAction}>
                    <input type="hidden" name="previewId" value={preview.id} />
                    <input type="hidden" name="slug" value={preview.lead.slug} />
                    <Button type="submit" size="sm" variant="outline">
                      <RefreshCw className="size-3.5" />
                      Run QC
                    </Button>
                  </form>
                  <form action={approvePreviewAction}>
                    <input type="hidden" name="previewId" value={preview.id} />
                    <input type="hidden" name="slug" value={preview.lead.slug} />
                    <Button type="submit" size="sm" variant="subtle">Approve</Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Emails needing review */}
      <Card>
        <CardHeader>
          <CardTitle>Emails needing review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {queue.emailsNeedingReview.length === 0 ? (
            <Empty>No emails need review.</Empty>
          ) : (
            queue.emailsNeedingReview.map((email) => (
              <div key={email.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3">
                <div>
                  <Link href={`/admin/leads/${email.lead.slug}`} className="font-medium text-white hover:text-brand-cyan">
                    {email.lead.businessName}
                  </Link>
                  <span className="ml-2 text-sm text-muted">{email.subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <form action={rejectEmailAction}>
                    <input type="hidden" name="emailDraftId" value={email.id} />
                    <input type="hidden" name="slug" value={email.lead.slug} />
                    <Button type="submit" size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                      Reject
                    </Button>
                  </form>
                  <form action={approveEmailAction}>
                    <input type="hidden" name="emailDraftId" value={email.id} />
                    <input type="hidden" name="slug" value={email.lead.slug} />
                    <Button type="submit" size="sm" variant="subtle">Approve</Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Dedicated sales leads */}
      <Card>
        <CardHeader>
          <CardTitle>Dedicated sales</CardTitle>
          <CardDescription>Strong existing sites discovered by Scope Market — highest audit scores first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {queue.dedicatedSalesLeads.length === 0 ? (
            <Empty>No dedicated-sales leads waiting.</Empty>
          ) : (
            queue.dedicatedSalesLeads.map((lead) => (
              <div key={lead.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3">
                <Link href={`/admin/leads/${lead.slug}`} className="font-medium text-white hover:text-brand-cyan">
                  {lead.businessName}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">Score {lead.auditScore ?? "—"}/100</span>
                  <form action={markContactedAction}>
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="slug" value={lead.slug} />
                    <Button type="submit" size="sm" variant="outline">
                      <Phone className="size-3.5" />
                      Mark contacted
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* High-opportunity leads */}
      <Card>
        <CardHeader>
          <CardTitle>High-opportunity leads</CardTitle>
          <CardDescription>Lowest audit scores first — the best redesign candidates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {queue.highOpportunityLeads.length === 0 ? (
            <Empty>No high-opportunity leads waiting.</Empty>
          ) : (
            queue.highOpportunityLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.slug}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/10 p-3 hover:bg-white/5"
              >
                <span className="font-medium text-white">{lead.businessName}</span>
                <span className="text-sm text-muted">Score {lead.auditScore ?? "—"}/100</span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* Failed agent steps */}
      <Card>
        <CardHeader>
          <CardTitle>Failed agent steps</CardTitle>
          <CardDescription>Retry to re-run the pipeline, or open the workflow run for details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {queue.failedSteps.length === 0 ? (
            <Empty>No failed steps.</Empty>
          ) : (
            queue.failedSteps.map((step) => (
              <div key={step.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3">
                <span className="text-sm text-white">
                  {step.agentName.replace(/_/g, " ")}
                  {step.lead && (
                    <Link href={`/admin/leads/${step.lead.slug}`} className="ml-2 text-brand-cyan hover:underline">
                      {step.lead.businessName}
                    </Link>
                  )}
                </span>
                <div className="flex items-center gap-3">
                  <Link href={`/admin/workflows/${step.workflowRunId}`} className="text-sm text-muted hover:text-white">
                    View run
                  </Link>
                  {step.leadId && step.lead && (
                    <form action={retryLeadPipelineAction}>
                      <input type="hidden" name="leadId" value={step.leadId} />
                      <input type="hidden" name="slug" value={step.lead.slug} />
                      <Button type="submit" size="sm" variant="outline">
                        <RefreshCw className="size-3.5" />
                        Retry
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Rejected (do-not-send) emails */}
      <Card>
        <CardHeader>
          <CardTitle>Rejected emails</CardTitle>
          <CardDescription>Marked do-not-send. Approve to override if this was a mistake.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {queue.doNotSendEmails.length === 0 ? (
            <Empty>No rejected emails.</Empty>
          ) : (
            queue.doNotSendEmails.map((email) => {
              const flags = Array.isArray(email.complianceFlagsJson) ? (email.complianceFlagsJson as string[]) : [];
              return (
                <div key={email.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3">
                  <div>
                    <Link href={`/admin/leads/${email.lead.slug}`} className="font-medium text-white hover:text-brand-cyan">
                      {email.lead.businessName}
                    </Link>
                    <span className="ml-2 text-sm text-muted">{email.subject}</span>
                    {flags.length > 0 && <p className="mt-1 text-xs text-amber-400">{flags.join(" · ")}</p>}
                  </div>
                  <form action={approveEmailAction}>
                    <input type="hidden" name="emailDraftId" value={email.id} />
                    <input type="hidden" name="slug" value={email.lead.slug} />
                    <Button type="submit" size="sm" variant="outline">
                      Approve anyway
                    </Button>
                  </form>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted">{children}</p>;
}
