"use server";

import { revalidatePath } from "next/cache";

import { runLeadPipeline, runPreviewGeneration } from "@/modules/agents";
import { addLeadNote, updateLeadPaymentStatus, updateLeadStatus } from "@/modules/crm/leads";
import { LEAD_STATUSES, PAYMENT_STATUSES, type LeadStatus, type PaymentStatus } from "@/modules/shared/types";

export interface UpdateStatusState {
  error?: string;
  success?: boolean;
}

export async function updateLeadStatusAction(
  _prevState: UpdateStatusState | undefined,
  formData: FormData,
): Promise<UpdateStatusState> {
  const leadId = String(formData.get("leadId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!leadId || !slug) {
    return { error: "Missing lead reference." };
  }

  if (!(LEAD_STATUSES as readonly string[]).includes(status)) {
    return { error: "Invalid status." };
  }

  await updateLeadStatus(leadId, status as LeadStatus);

  revalidatePath(`/admin/leads/${slug}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");

  return { success: true };
}

export interface UpdatePaymentStatusState {
  error?: string;
  success?: boolean;
}

export async function updatePaymentStatusAction(
  _prevState: UpdatePaymentStatusState | undefined,
  formData: FormData,
): Promise<UpdatePaymentStatusState> {
  const leadId = String(formData.get("leadId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const paymentStatus = String(formData.get("paymentStatus") ?? "");

  if (!leadId || !slug) {
    return { error: "Missing lead reference." };
  }

  if (!(PAYMENT_STATUSES as readonly string[]).includes(paymentStatus)) {
    return { error: "Invalid payment status." };
  }

  await updateLeadPaymentStatus(leadId, paymentStatus as PaymentStatus);

  revalidatePath(`/admin/leads/${slug}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin/payments");
  revalidatePath("/admin");

  return { success: true };
}

export interface AddNoteState {
  error?: string;
  success?: boolean;
}

export async function addLeadNoteAction(_prevState: AddNoteState | undefined, formData: FormData): Promise<AddNoteState> {
  const leadId = String(formData.get("leadId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!leadId || !slug) {
    return { error: "Missing lead reference." };
  }

  if (!note) {
    return { error: "Note cannot be empty." };
  }

  await addLeadNote(leadId, note);

  revalidatePath(`/admin/leads/${slug}`);
  revalidatePath("/admin");

  return { success: true };
}

export interface RunPipelineState {
  error?: string;
  success?: boolean;
  message?: string;
}

/**
 * Run the full internal agent pipeline (qualify → crawl → audit) for one lead.
 * This is the "run full workflow" action from the lead detail page.
 */
export async function runPipelineAction(
  _prevState: RunPipelineState | undefined,
  formData: FormData,
): Promise<RunPipelineState> {
  const leadId = String(formData.get("leadId") ?? "");
  const slug = String(formData.get("slug") ?? "");

  if (!leadId || !slug) {
    return { error: "Missing lead reference." };
  }

  try {
    const result = await runLeadPipeline(leadId, { createdBy: "admin_dashboard" });

    const message =
      result.outcome === "audited"
        ? `Pipeline complete - audit score ${result.auditScore}/100 (${result.opportunity?.replace(/_/g, " ")}).`
        : result.outcome === "crawl_failed"
          ? "Pipeline stopped - the website could not be crawled."
          : result.outcome === "rejected"
            ? "Lead was rejected during qualification."
            : result.outcome === "needs_manual_review"
              ? "Lead needs manual review (no valid website)."
              : "Pipeline finished with errors - see the workflow run.";

    revalidatePath(`/admin/leads/${slug}`);
    revalidatePath("/admin/leads");
    revalidatePath("/admin/workflows");
    revalidatePath("/admin");

    return { success: true, message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Pipeline failed to start." };
  }
}

export interface GeneratePreviewState {
  error?: string;
  success?: boolean;
  previewUrl?: string;
}

/** Generate (or regenerate) the preview homepage concept for a lead. */
export async function generatePreviewAction(
  _prevState: GeneratePreviewState | undefined,
  formData: FormData,
): Promise<GeneratePreviewState> {
  const leadId = String(formData.get("leadId") ?? "");
  const slug = String(formData.get("slug") ?? "");

  if (!leadId || !slug) {
    return { error: "Missing lead reference." };
  }

  try {
    const result = await runPreviewGeneration(leadId, { createdBy: "admin_dashboard" });

    revalidatePath(`/admin/leads/${slug}`);
    revalidatePath("/admin/previews");
    revalidatePath("/admin");

    return { success: true, previewUrl: `/preview/${result.slug}?token=${result.token}` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Preview generation failed." };
  }
}
