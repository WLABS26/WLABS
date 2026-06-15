import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Flame, Inbox, Users, Workflow } from "lucide-react";

import { InboundRequestStatusBadge, LeadStatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { getDashboardStats } from "@/modules/crm/dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    { label: "Total Leads", value: stats.totalLeads, icon: Users, href: "/admin/leads" },
    {
      label: "High Opportunity",
      value: stats.highOpportunityLeads,
      icon: Flame,
      href: "/admin/leads?status=high_opportunity",
    },
    { label: "New Inbound Requests", value: stats.newInboundRequests, icon: Inbox, href: "/admin/leads" },
    { label: "Active Workflow Runs", value: stats.activeWorkflowRuns, icon: Workflow, href: "/admin/workflows" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Overview of your lead pipeline and agent workflows.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="h-full transition-colors hover:border-white/20">
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">{card.label}</p>
                  <p className="mt-1 text-3xl font-bold text-white">{card.value}</p>
                </div>
                <card.icon className="size-8 text-brand-cyan" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Pipeline funnel</CardTitle>
          {stats.rejectedLeads > 0 && (
            <Link href="/admin/leads?status=rejected" className="text-xs font-medium text-red-400 hover:underline">
              {stats.rejectedLeads} rejected lead{stats.rejectedLeads === 1 ? "" : "s"} awaiting follow-up →
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
            {stats.funnel.map((stage, index) => (
              <div key={stage.key} className="flex items-center gap-2">
                <Link
                  href={`/admin/leads?status=${stage.statuses.join(",")}`}
                  className="flex min-w-[110px] flex-col items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-center transition-colors hover:border-white/20 hover:bg-white/5"
                >
                  <span className="text-2xl font-bold text-white">{stage.count}</span>
                  <span className="mt-1 text-xs text-muted">{stage.label}</span>
                </Link>
                {index < stats.funnel.length - 1 && <ChevronRight className="size-4 shrink-0 text-muted" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pipeline breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {stats.leadsByStatus.length === 0 && <p className="text-sm text-muted">No leads yet.</p>}
            {stats.leadsByStatus.map((group) => (
              <Link
                key={group.status}
                href={`/admin/leads?status=${group.status}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/5"
              >
                <LeadStatusBadge status={group.status} />
                <span className="font-semibold text-white">{group.count}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentActivities.length === 0 && <p className="text-sm text-muted">No activity yet.</p>}
            {stats.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white">{activity.description}</p>
                  <Link href={`/admin/leads/${activity.lead.slug}`} className="text-xs text-brand-cyan hover:underline">
                    {activity.lead.businessName}
                  </Link>
                </div>
                <span className="shrink-0 text-xs text-muted">{formatRelativeTime(activity.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Recent inbound requests</CardTitle>
          <Link href="/admin/leads" className="text-xs font-medium text-brand-cyan hover:underline">
            View all leads
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.recentInboundRequests.length === 0 && <p className="text-sm text-muted">No inbound requests yet.</p>}
          {stats.recentInboundRequests.map((request) => (
            <div
              key={request.id}
              className="flex flex-col gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {request.businessName || request.name}
                  {request.businessName && <span className="ml-2 text-xs text-muted">({request.name})</span>}
                </p>
                <p className="truncate text-xs text-muted">
                  {request.email}
                  {request.websiteUrl ? ` · ${request.websiteUrl}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">{formatRelativeTime(request.createdAt)}</span>
                <InboundRequestStatusBadge status={request.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
