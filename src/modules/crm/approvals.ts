/**
 * Human approval actions - the mandatory manual gates.
 *
 * No preview is client-ready and no email is send-ready until a human approves
 * it here. These helpers also cover the terminal CRM transitions (contacted,
 * replied, won/lost) and suppression.
 */
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/modules/crm/activity";
import { buildIntakeUrl, getLatestPreviewForLead } from "@/modules/generator/preview-store";
import { addSuppression } from "@/modules/lead-source/suppression";

/** Approve a generated preview (human gate before it is shown as client-ready). */
export async function approvePreview(previewId: string) {
  const preview = await prisma.preview.update({
    where: { id: previewId },
    data: { status: "approved" },
  });
  await logActivity(preview.leadId, "preview_approved", "Preview approved by a human reviewer.", { previewId });
  return preview;
}

/** Approve an email draft (human gate before it can be exported/sent). */
export async function approveEmail(emailDraftId: string) {
  const email = await prisma.emailDraft.update({
    where: { id: emailDraftId },
    data: { status: "approved" },
  });
  await prisma.lead.update({ where: { id: email.leadId }, data: { status: "approved" } });
  await logActivity(email.leadId, "email_approved", "Email approved and ready to send.", { emailDraftId });
  return email;
}

/** Mark an email draft as do-not-send. */
export async function rejectEmail(emailDraftId: string) {
  const email = await prisma.emailDraft.update({
    where: { id: emailDraftId },
    data: { status: "do_not_send" },
  });
  await logActivity(email.leadId, "email_rejected", "Email marked do-not-send.", { emailDraftId });
  return email;
}

/** Record that an approved email was sent (manual step - WLABS never auto-sends). */
export async function markContacted(leadId: string) {
  await prisma.lead.update({ where: { id: leadId }, data: { status: "contacted" } });
  await logActivity(leadId, "status_changed", "Lead marked as contacted.", { status: "contacted" });
}

export async function markReplied(leadId: string) {
  await prisma.lead.update({ where: { id: leadId }, data: { status: "replied" } });

  const metadata: Record<string, unknown> = { status: "replied" };
  const preview = await getLatestPreviewForLead(leadId);
  if (preview) metadata.intakeUrl = buildIntakeUrl(preview.slug, preview.token);

  await logActivity(leadId, "reply_received", "Lead replied.", metadata);
}

export async function markWon(leadId: string) {
  await prisma.lead.update({ where: { id: leadId }, data: { status: "won" } });
  await logActivity(leadId, "status_changed", "Lead marked as won.", { status: "won" });
}

export async function markLost(leadId: string) {
  await prisma.lead.update({ where: { id: leadId }, data: { status: "lost" } });
  await logActivity(leadId, "status_changed", "Lead marked as lost.", { status: "lost" });
}

/**
 * Suppress a lead: add it to the suppression register, flag do-not-contact, and
 * move it to the suppressed state. Future imports/outreach will skip it.
 */
export async function suppressLead(leadId: string, reason = "Manually suppressed from the admin dashboard.") {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  await addSuppression({ email: lead.contactEmail, websiteUrl: lead.websiteUrl, reason });
  await prisma.lead.update({ where: { id: leadId }, data: { status: "suppressed", doNotContact: true } });
  await logActivity(leadId, "lead_suppressed", reason, { reason });
}
