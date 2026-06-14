/**
 * Workflow runner: orchestrates agents and persists their execution.
 *
 * The runner is the bridge between the pure, testable Agent classes and the
 * database. It creates WorkflowRun / WorkflowStep records, flips their status
 * as agents execute, and stores inputs, outputs, and errors as JSON so every
 * run is fully auditable from the admin dashboard.
 */
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Agent } from "./base-agent";
import type { AgentResult } from "./types";

/** Round-trip a value through JSON so Dates/undefined are coerced to JSON-safe shapes. */
function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export interface StartRunOptions {
  workflowType: string;
  leadId?: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

/** Create a WorkflowRun in the `running` state. */
export async function startWorkflowRun(options: StartRunOptions) {
  return prisma.workflowRun.create({
    data: {
      workflowType: options.workflowType,
      status: "running",
      startedAt: new Date(),
      createdBy: options.createdBy ?? null,
      metadataJson: toJson(options.metadata),
    },
  });
}

/** Mark a WorkflowRun terminal (completed/failed/waiting_for_approval/cancelled/paused). */
export async function finishWorkflowRun(
  runId: string,
  status: "completed" | "failed" | "waiting_for_approval" | "cancelled" | "paused",
) {
  return prisma.workflowRun.update({
    where: { id: runId },
    data: {
      status,
      completedAt: status === "waiting_for_approval" || status === "paused" ? null : new Date(),
    },
  });
}

export interface RunStepOptions {
  workflowRunId: string;
  leadId?: string;
}

/**
 * Run a single agent as a persisted WorkflowStep. Creates the step (running),
 * executes the agent, then records the outcome (status, output/error, timings,
 * retry count). Returns the agent's typed result for the caller to branch on.
 */
export async function runAgentStep<TInput, TOutput>(
  agent: Agent<TInput, TOutput>,
  rawInput: TInput,
  options: RunStepOptions,
): Promise<AgentResult<TOutput>> {
  const step = await prisma.workflowStep.create({
    data: {
      workflowRunId: options.workflowRunId,
      leadId: options.leadId ?? null,
      agentName: agent.name,
      status: "running",
      startedAt: new Date(),
      inputJson: toJson(rawInput),
    },
  });

  const result = await agent.run(rawInput, {
    workflowRunId: options.workflowRunId,
    leadId: options.leadId,
  });

  await prisma.workflowStep.update({
    where: { id: step.id },
    data: {
      status: result.status,
      outputJson: toJson(result.output),
      errorJson: toJson(result.error),
      completedAt: result.completedAt,
      retryCount: Math.max(0, result.attempts - 1),
    },
  });

  return result;
}

/** Record a step that never ran because an upstream step failed. */
export async function recordSkippedStep(agentName: string, options: RunStepOptions) {
  return prisma.workflowStep.create({
    data: {
      workflowRunId: options.workflowRunId,
      leadId: options.leadId ?? null,
      agentName,
      status: "skipped",
    },
  });
}
