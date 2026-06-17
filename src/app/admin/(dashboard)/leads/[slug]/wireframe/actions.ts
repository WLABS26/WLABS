"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/modules/crm/activity";
import { buildWireframeInput } from "@/modules/agents/wireframe-input";
import { refineWireframe } from "@/modules/agents/wireframe-generation-agent";

export interface WireframeChatMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface RefineWireframeState {
  error?: string;
  chat?: WireframeChatMessage[];
  v?: number;
}

export async function refineWireframeAction(
  _prevState: RefineWireframeState | undefined,
  formData: FormData,
): Promise<RefineWireframeState> {
  const previewId = String(formData.get("previewId") ?? "");
  const leadSlug = String(formData.get("leadSlug") ?? "");
  const instruction = String(formData.get("instruction") ?? "").trim();

  if (!previewId || !leadSlug || !instruction) {
    return { error: "Missing required fields." };
  }

  const preview = await prisma.preview.findUnique({ where: { id: previewId }, include: { lead: true } });
  if (!preview || !preview.wireframeHtml) {
    return { error: "Wireframe not found." };
  }

  const capture = await prisma.websiteCapture.findFirst({
    where: { leadId: preview.leadId, crawlStatus: "success" },
    orderBy: { createdAt: "desc" },
  });
  const audit = await prisma.audit.findFirst({
    where: { leadId: preview.leadId },
    orderBy: { createdAt: "desc" },
  });

  const input = buildWireframeInput(preview.lead, capture, audit);
  const { html, reply } = await refineWireframe({ currentHtml: preview.wireframeHtml, instruction, input });

  const existingChat = (preview.wireframeChatJson as WireframeChatMessage[] | null) ?? [];
  const userMsg: WireframeChatMessage = { role: "user", content: instruction, at: new Date().toISOString() };
  const assistantMsg: WireframeChatMessage = { role: "assistant", content: reply, at: new Date().toISOString() };
  const newChat = [...existingChat, userMsg, assistantMsg];

  await prisma.preview.update({
    where: { id: previewId },
    data: {
      ...(html ? { wireframeHtml: html } : {}),
      wireframeChatJson: newChat as object[],
    },
  });

  if (html) {
    await logActivity(preview.leadId, "wireframe_refined", instruction);
  }

  revalidatePath(`/admin/leads/${leadSlug}/wireframe`);
  revalidatePath(`/admin/leads/${leadSlug}`);

  return { chat: newChat, v: Date.now() };
}
