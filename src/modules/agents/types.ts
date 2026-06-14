/**
 * Shared types for the WLABS internal agent system.
 *
 * Every automation in WLABS is modelled as an Agent: a modular service with a
 * typed input, a typed output, input/output validation, retry behaviour, and
 * structured logging. Agents are orchestrated by the workflow runner
 * (see runner.ts), which persists their execution as WorkflowRun / WorkflowStep
 * records so progress is visible in the admin dashboard.
 */
import type { AgentStepStatus } from "@/modules/shared/types";

/** How an agent should retry a failing `execute()` call. */
export interface RetryPolicy {
  /** Maximum number of retries after the first attempt (so total attempts = maxRetries + 1). */
  maxRetries: number;
  /** Base backoff in milliseconds; grows exponentially per attempt. */
  backoffMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = { maxRetries: 2, backoffMs: 300 };

export type AgentLogLevel = "debug" | "info" | "warn" | "error";

export interface AgentLogEntry {
  level: AgentLogLevel;
  message: string;
  data?: Record<string, unknown>;
  at: string;
}

/** Context handed to an agent's `execute()` method. */
export interface AgentExecuteContext {
  /** The lead this execution is operating on, when applicable. */
  leadId?: string;
  /** The workflow run this execution belongs to, when orchestrated. */
  workflowRunId?: string;
  /** Structured logger - entries are collected onto the AgentResult. */
  log: (level: AgentLogLevel, message: string, data?: Record<string, unknown>) => void;
}

/**
 * Terminal outcome of an agent run. `waiting_for_approval` lets an agent pause
 * a workflow at a human review gate; `skipped` is used by the runner when an
 * upstream step failed.
 */
export type AgentOutcome = Extract<
  AgentStepStatus,
  "completed" | "failed" | "waiting_for_approval" | "skipped"
>;

export interface AgentError {
  message: string;
  code?: string;
  /** Validation issues or other structured detail, safe to persist as JSON. */
  detail?: unknown;
}

export interface AgentResult<TOutput> {
  agentName: string;
  status: AgentOutcome;
  output?: TOutput;
  error?: AgentError;
  /** Number of attempts actually made (1 = succeeded first try). */
  attempts: number;
  logs: AgentLogEntry[];
  startedAt: Date;
  completedAt: Date;
}
