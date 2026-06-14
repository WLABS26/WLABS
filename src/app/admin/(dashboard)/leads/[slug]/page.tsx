import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, BarChart3, Building2, Calendar, ExternalLink, Globe, Mail, MapPin, Phone, User, Workflow } from "lucide-react";

import { AgentStepStatusBadge, InboundRequestStatusBadge, LeadStatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { getLeadBySlug } from "@/modules/crm/leads";
import { INDUSTRIES } from "@/modules/shared/constants";
import { AUDIT_CATEGORIES } from "@/modules/shared/types";

import { AddNoteForm } from "./add-note-form";
import { LeadStatusForm } from "./lead-status-form";
import { RunPipelineForm } from "./run-pipeline-form";

const AUDIT_CATEGORY_LABELS: Record<string, string> = {
  firstImpression: "First impression",
  mobileExperience: "Mobile experience",
  conversionReadiness: "Conversion readiness",
  contentClarity: "Content clarity",
  trustAndProof: "Trust & proof",
  technicalBasics: "Technical basics",
  localBusinessSignals: "Local signals",
};

const INDUSTRY_LABELS = new Map<string, string>(INDUSTRIES.map((industry) => [industry.value, industry.label]));

interface LeadDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LeadDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lead = await getLeadBySlug(slug);
  return { title: lead ? lead.businessName : "Lead not found" };
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { slug } = await params;
  const lead = await getLeadBySlug(slug);

  if (!lead) notFound();

  const websiteHref = lead.websiteUrl
    ? lead.websiteUrl.startsWith("http")
      ? lead.websiteUrl
      : `https://${lead.websiteUrl}`
    : null;

  return (
    <div className="space-y-6">
      <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
        <ArrowLeft className="size-4" />
        Back to leads
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{lead.businessName}</h1>
          <p className="mt-1 text-sm text-muted">{INDUSTRY_LABELS.get(lead.industry) ?? lead.industry}</p>
        </div>
        <LeadStatusBadge status={lead.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Lead information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-brand-cyan hover:underline"
                >
                  <Globe className="size-4 shrink-0" />
                  <span className="truncate">{lead.websiteUrl}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              )}
              {lead.contactPerson && (
                <div className="flex items-center gap-2 text-white">
                  <User className="size-4 shrink-0 text-muted" />
                  {lead.contactPerson}
                </div>
              )}
              {lead.contactEmail && (
                <a href={`mailto:${lead.contactEmail}`} className="flex items-center gap-2 text-white hover:text-brand-cyan">
                  <Mail className="size-4 shrink-0 text-muted" />
                  {lead.contactEmail}
                </a>
              )}
              {lead.contactPhone && (
                <a href={`tel:${lead.contactPhone}`} className="flex items-center gap-2 text-white hover:text-brand-cyan">
                  <Phone className="size-4 shrink-0 text-muted" />
                  {lead.contactPhone}
                </a>
              )}
              {(lead.city || lead.country) && (
                <div className="flex items-center gap-2 text-white">
                  <MapPin className="size-4 shrink-0 text-muted" />
                  {[lead.city, lead.country].filter(Boolean).join(", ")}
                </div>
              )}
              {lead.source && (
                <div className="flex items-center gap-2 text-muted">
                  <Building2 className="size-4 shrink-0" />
                  Source: {lead.source.replace(/_/g, " ")}
                </div>
              )}
              {lead.auditScore !== null && (
                <div className="flex items-center gap-2 text-muted">
                  <BarChart3 className="size-4 shrink-0" />
                  Audit score: <span className="text-white">{lead.auditScore} / 100</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted">
                <Calendar className="size-4 shrink-0" />
                Created {formatDateTime(lead.createdAt)}
              </div>
              {lead.doNotContact && (
                <div className="flex items-center gap-2 text-red-400">
                  <Ban className="size-4 shrink-0" />
                  Do not contact
                </div>
              )}
              {lead.notes && (
                <div className="border-t border-white/10 pt-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Notes</p>
                  <p className="whitespace-pre-wrap text-white">{lead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline status</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadStatusForm leadId={lead.id} slug={lead.slug} status={lead.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <RunPipelineForm leadId={lead.id} slug={lead.slug} />
            </CardContent>
          </Card>

          {lead.inboundRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Inbound requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lead.inboundRequests.map((request) => (
                  <div key={request.id} className="space-y-1 border-b border-white/5 pb-3 text-sm last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-white">{request.name}</span>
                      <InboundRequestStatusBadge status={request.status} />
                    </div>
                    <p className="text-xs text-muted">{request.email}</p>
                    {request.message && <p className="text-xs text-muted">{request.message}</p>}
                    <p className="text-xs text-muted">{formatRelativeTime(request.createdAt)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {lead.workflowSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Workflow steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {lead.workflowSteps.map((step) => (
                  <Link
                    key={step.id}
                    href={`/admin/workflows/${step.workflowRunId}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <Workflow className="size-4 text-muted" />
                      <span className="text-white">{step.agentName.replace(/_/g, " ")}</span>
                    </div>
                    <AgentStepStatusBadge status={step.status} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          {lead.audits.length > 0 &&
            (() => {
              const audit = lead.audits[0];
              const categoryScores = (audit.categoryScoresJson ?? {}) as Record<string, number>;
              const topIssues = (audit.topIssuesJson ?? []) as string[];
              const quickWins = (audit.quickWinsJson ?? []) as string[];
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Website audit</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-white">{audit.overallScore}</span>
                      <span className="text-sm text-muted">/ 100</span>
                      <span className="ml-auto text-sm capitalize text-brand-cyan">
                        {audit.qualificationStatus.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {AUDIT_CATEGORIES.map((category) => {
                        const score = categoryScores[category.key] ?? 0;
                        const pct = Math.round((score / category.maxPoints) * 100);
                        return (
                          <div key={category.key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted">{AUDIT_CATEGORY_LABELS[category.key] ?? category.label}</span>
                              <span className="text-white">
                                {score}/{category.maxPoints}
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {topIssues.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Top issues</p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-white">
                          {topIssues.map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {quickWins.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Quick wins</p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-white">
                          {quickWins.map((win) => (
                            <li key={win}>{win}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {audit.salesAngle && (
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Sales angle</p>
                        <p className="text-sm text-white">{audit.salesAngle}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

          <Card>
            <CardHeader>
              <CardTitle>Add note</CardTitle>
            </CardHeader>
            <CardContent>
              <AddNoteForm leadId={lead.id} slug={lead.slug} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.activities.length === 0 ? (
                <p className="text-sm text-muted">No activity yet.</p>
              ) : (
                lead.activities.map((activity) => (
                  <div key={activity.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-white">{activity.description}</p>
                      <span className="shrink-0 text-xs text-muted">{formatRelativeTime(activity.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-muted">{activity.type.replace(/_/g, " ")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
