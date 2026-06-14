/**
 * Base class for every WLABS agent.
 *
 * Subclasses declare a name, a description, zod input/output schemas, and an
 * `execute()` method containing the business logic. The base class handles
 * input validation, retry-with-backoff, output validation, structured logging,
 * and converting thrown errors into a typed AgentResult. This keeps each agent
 * small and individually testable, and gives the workflow runner a single,
 * uniform contract to orchestrate.
 */
import type { ZodType } from "zod";

import {
  type AgentError,
  type AgentExecuteContext,
  type AgentLogEntry,
  type AgentResult,
  DEFAULT_RETRY_POLICY,
  type RetryPolicy,
} from "./types";

/** A control-flow signal an agent can throw to pause a workflow at a human gate. */
export class ApprovalRequiredError extends Error {
  constructor(message = "Waiting for human approval") {
    super(message);
    this.name = "ApprovalRequiredError";
  }
}

/** An error an agent can throw to fail immediately without consuming retries. */
export class NonRetryableError extends Error {
  code?: string;
  detail?: unknown;
  constructor(message: string, options?: { code?: string; detail?: unknown }) {
    super(message);
    this.name = "NonRetryableError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function toAgentError(err: unknown): AgentError {
  if (err instanceof NonRetryableError) {
    return { message: err.message, code: err.code, detail: err.detail };
  }
  if (err instanceof Error) {
    return { message: err.message, code: err.name };
  }
  return { message: String(err) };
}

export abstract class Agent<TInput, TOutput> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly inputSchema: ZodType<TInput>;
  abstract readonly outputSchema: ZodType<TOutput>;

  readonly retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY;

  /** Core business logic. Throw to fail; throw ApprovalRequiredError to pause. */
  protected abstract execute(input: TInput, ctx: AgentExecuteContext): Promise<TOutput>;

  /** Validate raw input against the schema (throws on failure). */
  validateInput(input: unknown): TInput {
    return this.inputSchema.parse(input);
  }

  /** Validate produced output against the schema (throws on failure). */
  validateOutput(output: unknown): TOutput {
    return this.outputSchema.parse(output);
  }

  /**
   * Run the agent end to end: validate input, execute with retry/backoff,
   * validate output, and return a typed result. Never throws - failures are
   * captured on the returned AgentResult so the runner can persist them.
   */
  async run(
    rawInput: unknown,
    ctx: Pick<AgentExecuteContext, "leadId" | "workflowRunId"> = {},
  ): Promise<AgentResult<TOutput>> {
    const logs: AgentLogEntry[] = [];
    const startedAt = new Date();
    const log: AgentExecuteContext["log"] = (level, message, data) => {
      logs.push({ level, message, data, at: new Date().toISOString() });
    };
    const execCtx: AgentExecuteContext = { ...ctx, log };

    let input: TInput;
    try {
      input = this.validateInput(rawInput);
    } catch (err) {
      log("error", "Input validation failed", { error: String(err) });
      return {
        agentName: this.name,
        status: "failed",
        error: { message: "Input validation failed", code: "INVALID_INPUT", detail: toAgentError(err) },
        attempts: 0,
        logs,
        startedAt,
        completedAt: new Date(),
      };
    }

    let attempts = 0;
    let lastError: AgentError | undefined;

    for (let attempt = 0; attempt <= this.retryPolicy.maxRetries; attempt += 1) {
      attempts = attempt + 1;
      try {
        log("info", `Executing ${this.name} (attempt ${attempts})`);
        const rawOutput = await this.execute(input, execCtx);
        const output = this.validateOutput(rawOutput);
        log("info", `${this.name} completed`);
        return {
          agentName: this.name,
          status: "completed",
          output,
          attempts,
          logs,
          startedAt,
          completedAt: new Date(),
        };
      } catch (err) {
        if (err instanceof ApprovalRequiredError) {
          log("info", err.message);
          return {
            agentName: this.name,
            status: "waiting_for_approval",
            attempts,
            logs,
            startedAt,
            completedAt: new Date(),
          };
        }

        lastError = toAgentError(err);
        const retryable = !(err instanceof NonRetryableError);
        log("warn", `${this.name} attempt ${attempts} failed: ${lastError.message}`, { retryable });

        if (!retryable || attempt === this.retryPolicy.maxRetries) break;
        await sleep(this.retryPolicy.backoffMs * 2 ** attempt);
      }
    }

    return {
      agentName: this.name,
      status: "failed",
      error: lastError ?? { message: "Unknown error" },
      attempts,
      logs,
      startedAt,
      completedAt: new Date(),
    };
  }
}
