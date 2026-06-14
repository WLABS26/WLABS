"use server";

import { revalidatePath } from "next/cache";

import {
  cancelWorkflowRun,
  pauseWorkflowRun,
  resumeWorkflowRun,
  runBatch,
  runLeadPipeline,
  type BatchOperation,
} from "@/modules/agents";

const VALID_OPERATIONS: BatchOperation[] = ["full_pipeline", "preview", "email"];

export interface StartBatchState {
  error?: string;
  summary?: { operation: string; processed: number; succeeded: number; failed: number };
}

/** Start a batch run of the chosen operation across eligible leads. */
export async function startBatchAction(
  _prevState: StartBatchState | undefined,
  formData: FormData,
): Promise<StartBatchState> {
  const operation = String(formData.get("operation") ?? "full_pipeline") as BatchOperation;
  const batchSize = Number(formData.get("batchSize") ?? 10);

  if (!VALID_OPERATIONS.includes(operation)) return { error: "Invalid operation." };

  try {
    const result = await runBatch({ operation, batchSize, createdBy: "batch:dashboard" });
    revalidatePath("/admin/workflows");
    revalidatePath("/admin");
    revalidatePath("/admin/leads");
    return {
      summary: {
        operation: result.operation,
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
      },
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Batch failed to start." };
  }
}

export async function pauseRunAction(formData: FormData): Promise<void> {
  await pauseWorkflowRun(String(formData.get("runId")));
  revalidatePath(`/admin/workflows/${formData.get("runId")}`);
  revalidatePath("/admin/workflows");
}

export async function resumeRunAction(formData: FormData): Promise<void> {
  await resumeWorkflowRun(String(formData.get("runId")));
  revalidatePath(`/admin/workflows/${formData.get("runId")}`);
  revalidatePath("/admin/workflows");
}

export async function cancelRunAction(formData: FormData): Promise<void> {
  await cancelWorkflowRun(String(formData.get("runId")));
  revalidatePath(`/admin/workflows/${formData.get("runId")}`);
  revalidatePath("/admin/workflows");
}

/** Re-run the full lead pipeline for a run's lead (recovers failed runs). */
export async function rerunPipelineAction(formData: FormData): Promise<void> {
  const leadId = String(formData.get("leadId"));
  if (leadId) {
    await runLeadPipeline(leadId, { createdBy: "rerun:dashboard" });
    revalidatePath("/admin/workflows");
    revalidatePath("/admin/leads");
    revalidatePath("/admin");
  }
}
