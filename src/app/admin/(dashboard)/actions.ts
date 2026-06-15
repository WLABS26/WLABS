"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { runEmailDrafting, runLeadPipeline, runPreviewQc } from "@/modules/agents";
import {
  approveEmail,
  approvePreview,
  markContacted,
  markLost,
  markReplied,
  markWon,
  rejectEmail,
  suppressLead,
} from "@/modules/crm/approvals";
import { deleteLead, requeueRejectedLead } from "@/modules/crm/leads";
import { EMAIL_VARIANTS, type EmailVariant } from "@/modules/shared/types";

/** Revalidate the admin surfaces affected by a lead/preview/email change. */
function revalidateAdmin(slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/review");
  revalidatePath("/admin/previews");
  revalidatePath("/admin/emails");
  if (slug) revalidatePath(`/admin/leads/${slug}`);
}

export async function approvePreviewAction(formData: FormData): Promise<void> {
  await approvePreview(String(formData.get("previewId")));
  revalidateAdmin(String(formData.get("slug") || ""));
}

export async function runPreviewQcAction(formData: FormData): Promise<void> {
  await runPreviewQc(String(formData.get("previewId")), { createdBy: "admin_dashboard" });
  revalidateAdmin(String(formData.get("slug") || ""));
}

export async function approveEmailAction(formData: FormData): Promise<void> {
  await approveEmail(String(formData.get("emailDraftId")));
  revalidateAdmin(String(formData.get("slug") || ""));
}

export async function rejectEmailAction(formData: FormData): Promise<void> {
  await rejectEmail(String(formData.get("emailDraftId")));
  revalidateAdmin(String(formData.get("slug") || ""));
}

export async function suppressLeadAction(formData: FormData): Promise<void> {
  await suppressLead(String(formData.get("leadId")));
  revalidateAdmin(String(formData.get("slug") || ""));
}

/** Move a rejected lead back to "qualified" so it re-enters the pipeline for review. */
export async function requeueLeadAction(formData: FormData): Promise<void> {
  await requeueRejectedLead(String(formData.get("leadId")));
  revalidateAdmin(String(formData.get("slug") || ""));
}

/**
 * Retry the agent pipeline for a lead with a failed step, from the review
 * queue. Errors are swallowed - the resulting workflow step/run already
 * records the outcome for diagnosis via "View run".
 */
export async function retryLeadPipelineAction(formData: FormData): Promise<void> {
  const leadId = String(formData.get("leadId") || "");
  if (!leadId) return;

  try {
    await runLeadPipeline(leadId, { createdBy: "admin_dashboard" });
  } catch {
    // Swallowed - see workflow run for failure details.
  }

  revalidateAdmin(String(formData.get("slug") || ""));
  revalidatePath("/admin/workflows");
}

/**
 * Permanently delete a lead (e.g. a discovery result that doesn't make
 * sense). If `redirectTo` is set - used from the lead detail page, which no
 * longer exists afterwards - navigate there; otherwise (e.g. a row action on
 * the leads list) just revalidate in place.
 */
export async function deleteLeadAction(formData: FormData): Promise<void> {
  const leadId = String(formData.get("leadId") || "");
  if (!leadId) return;

  await deleteLead(leadId);
  revalidateAdmin();
  revalidatePath("/admin/discovery");
  revalidatePath("/admin/discovery/sales");

  const redirectTo = String(formData.get("redirectTo") || "");
  if (redirectTo) redirect(redirectTo);
}

export async function markContactedAction(formData: FormData): Promise<void> {
  await markContacted(String(formData.get("leadId")));
  revalidateAdmin(String(formData.get("slug") || ""));
}

export async function markRepliedAction(formData: FormData): Promise<void> {
  await markReplied(String(formData.get("leadId")));
  revalidateAdmin(String(formData.get("slug") || ""));
}

export async function markWonAction(formData: FormData): Promise<void> {
  await markWon(String(formData.get("leadId")));
  revalidateAdmin(String(formData.get("slug") || ""));
}

export async function markLostAction(formData: FormData): Promise<void> {
  await markLost(String(formData.get("leadId")));
  revalidateAdmin(String(formData.get("slug") || ""));
}

export interface DraftEmailState {
  error?: string;
  success?: boolean;
  qcStatus?: string;
}

/** Draft an outreach email (+ QC) for a lead, choosing one of the six variants. */
export async function draftEmailAction(
  _prevState: DraftEmailState | undefined,
  formData: FormData,
): Promise<DraftEmailState> {
  const leadId = String(formData.get("leadId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const variant = String(formData.get("variant") ?? "direct_preview");

  if (!leadId) return { error: "Missing lead reference." };
  if (!(EMAIL_VARIANTS as readonly string[]).includes(variant)) return { error: "Invalid email variant." };

  try {
    const result = await runEmailDrafting(leadId, variant as EmailVariant, { createdBy: "admin_dashboard" });
    revalidateAdmin(slug);
    return { success: true, qcStatus: result.qcStatus };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Email drafting failed." };
  }
}
