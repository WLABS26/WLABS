"use server";

import { redirect } from "next/navigation";

import { createLead } from "@/modules/crm/leads";

export interface CreateLeadState {
  error?: string;
}

export async function createLeadAction(_prevState: CreateLeadState | undefined, formData: FormData): Promise<CreateLeadState> {
  const businessName = String(formData.get("businessName") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();

  if (!businessName) {
    return { error: "Business name is required." };
  }

  const lead = await createLead({
    businessName,
    industry,
    websiteUrl: String(formData.get("websiteUrl") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    contactPhone: String(formData.get("contactPhone") ?? ""),
    contactPerson: String(formData.get("contactPerson") ?? ""),
    city: String(formData.get("city") ?? ""),
    country: String(formData.get("country") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  redirect(`/admin/leads/${lead.slug}`);
}
