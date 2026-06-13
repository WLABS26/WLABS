"use server";

import { revalidatePath } from "next/cache";

import { addLeadNote, updateLeadStatus } from "@/modules/crm/leads";
import { LEAD_STATUSES, type LeadStatus } from "@/modules/shared/types";

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
