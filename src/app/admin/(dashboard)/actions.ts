"use server";

import { revalidatePath } from "next/cache";

import { runEmailDrafting, runPreviewQc } from "@/modules/agents";
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
