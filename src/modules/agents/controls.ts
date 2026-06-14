/**
 * Workflow run controls: pause / resume / cancel.
 *
 * In the local-first MVP, pipelines execute synchronously, so these primarily
 * manage run status for visibility and to gate future background workers. The
 * status transitions are still recorded so the dashboard reflects operator
 * intent.
 */
import type { WorkflowRunStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

async function setStatus(id: string, status: WorkflowRunStatus, completed = false) {
  return prisma.workflowRun.update({
    where: { id },
    data: { status, ...(completed ? { completedAt: new Date() } : {}) },
  });
}

export const pauseWorkflowRun = (id: string) => setStatus(id, "paused");
export const resumeWorkflowRun = (id: string) => setStatus(id, "running");
export const cancelWorkflowRun = (id: string) => setStatus(id, "cancelled", true);
