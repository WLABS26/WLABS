import type { Metadata } from "next";
import Link from "next/link";
import { Workflow } from "lucide-react";

import { WorkflowRunStatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { listWorkflowRuns } from "@/modules/agents/workflow";

import { StartBatchForm } from "./start-batch-form";

export const metadata: Metadata = {
  title: "Workflows",
};

export default async function AdminWorkflowsPage() {
  const runs = await listWorkflowRuns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Workflow center</h1>
        <p className="mt-1 text-sm text-muted">Run controlled batches and track the agent pipeline end to end.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start a batch</CardTitle>
          <CardDescription>Process a controlled batch of eligible leads through an agent operation.</CardDescription>
        </CardHeader>
        <CardContent>
          <StartBatchForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {runs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No workflow runs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <Link
                        href={`/admin/workflows/${run.id}`}
                        className="flex items-center gap-2 font-medium text-white hover:text-brand-cyan"
                      >
                        <Workflow className="size-4 text-muted" />
                        {run.workflowType.replace(/_/g, " ")}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <WorkflowRunStatusBadge status={run.status} />
                    </TableCell>
                    <TableCell className="text-muted">{run._count.steps}</TableCell>
                    <TableCell className="text-muted">{run.startedAt ? formatDateTime(run.startedAt) : "—"}</TableCell>
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
