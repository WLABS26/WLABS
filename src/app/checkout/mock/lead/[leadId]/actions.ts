"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";

import { prisma } from "@/lib/prisma";
import { markLeadAsPaid } from "@/modules/payments/stripe";
import { onPublicPaymentSettled } from "@/modules/agents/website-build";

export async function completeMockLeadCheckoutAction(formData: FormData): Promise<void> {
  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId) redirect("/");

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!lead) redirect("/");

  await markLeadAsPaid(leadId, { checkoutSessionId: `mock_lead_${leadId}_${Date.now()}` });
  after(() => onPublicPaymentSettled(leadId));

  redirect(`/checkout/success?lead=${leadId}`);
}
