import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AgentStepStatusBadge, WorkflowRunStatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { getWorkflowRun } from "@/modules/agents/workflow";

import { cancelRunAction, pauseRunAction, rerunPipelineAction, resumeRunAction } from "../actions";

interface WorkflowRunPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WorkflowRunPageProps): Promise<Metadata> {
  const { id } = await params;
  const run = await getWorkflowRun(id);
  return { title: run ? `Workflow: ${run.workflowType.replace(/_/g, " ")}` : "Workflow run not found" };
}

export default async function WorkflowRunPage({ params }: WorkflowRunPageProps) {
  const { id } = await params;
  const run = await getWorkflowRun(id);

  if (!run) notFound();

  const stepsWithErrors = run.steps.filter((step) => step.errorJson);
  const leadId = run.steps.find((step) => step.leadId)?.leadId ?? null;
  const isActive = run.status === "running" || run.status === "pending";

  return (
    <div className="space-y-6">
      <Link href="/admin/workflows" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
        <ArrowLeft className="size-4" />
        Back to workflows
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize text-white">{run.workflowType.replace(/_/g, " ")}</h1>
          <p className="mt-1 text-sm text-muted">
            Started {run.startedAt ? formatDateTime(run.startedAt) : "—"}
            {run.completedAt && ` · Completed ${formatDateTime(run.completedAt)}`}
          </p>
        </div>
        <WorkflowRunStatusBadge status={run.status} />
      </div>

      {/* Run controls */}
      <div className="flex flex-wrap gap-2">
        {isActive && (
          <form action={pauseRunAction}>
            <input type="hidden" name="runId" value={run.id} />
            <Button type="submit" size="sm" variant="outline">Pause</Button>
          </form>
        )}
        {run.status === "paused" && (
          <form action={resumeRunAction}>
            <input type="hidden" name="runId" value={run.id} />
            <Button type="submit" size="sm" variant="outline">Resume</Button>
          </form>
        )}
        {(isActive || run.status === "paused") && (
          <form action={cancelRunAction}>
            <input type="hidden" name="runId" value={run.id} />
            <Button type="submit" size="sm" variant="ghost" className="text-red-400 hover:text-red-300">Cancel</Button>
          </form>
        )}
        {leadId && (run.status === "failed" || run.status === "cancelled") && (
          <form action={rerunPipelineAction}>
            <input type="hidden" name="leadId" value={leadId} />
            <Button type="submit" size="sm" variant="subtle">Re-run pipeline</Button>
          </form>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Steps</CardTitle>
        </CardHeader>
        <CardContent>
          {run.steps.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No steps recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {run.steps.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell className="font-medium text-white">{step.agentName.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-muted">
                      {step.lead ? (
                        <Link href={`/admin/leads/${step.lead.slug}`} className="hover:text-brand-cyan">
                          {step.lead.businessName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <AgentStepStatusBadge status={step.status} />
                    </TableCell>
                    <TableCell className="text-muted">{step.retryCount}</TableCell>
                    <TableCell className="text-muted">{step.startedAt ? formatDateTime(step.startedAt) : "—"}</TableCell>
                    <TableCell className="text-muted">{step.completedAt ? formatDateTime(step.completedAt) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {stepsWithErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Errors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stepsWithErrors.map((step) => (
              <div key={step.id} className="space-y-1">
                <p className="text-sm font-medium text-white">{step.agentName.replace(/_/g, " ")}</p>
                <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-red-300">
                  {JSON.stringify(step.errorJson, null, 2)}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
