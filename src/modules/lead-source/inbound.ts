import { prisma } from "@/lib/prisma";
import { logActivity } from "@/modules/crm/activity";
import { generateUniqueSlug } from "@/modules/crm/leads";
import { checkSuppression } from "@/modules/lead-source/suppression";

export interface InboundLeadInput {
  name: string;
  businessName?: string | null;
  websiteUrl?: string | null;
  email: string;
  phone?: string | null;
  industry?: string | null;
  message?: string | null;
  /** Where this inbound request originated, e.g. "website_preview_form" | "contact_form" */
  source: string;
}

export type InboundLeadStatus = "created" | "linked_existing" | "suppressed" | "stored_only";

export interface InboundLeadResult {
  inboundRequestId: string;
  leadId?: string;
  status: InboundLeadStatus;
}

/**
 * Step 1 of the inbound lead workflow (see docs/agents.md):
 *  1. Save the InboundRequest
 *  2. Check the suppression list
 *  3. Deduplicate against existing Leads (by website URL or email)
 *  4. Create (or link to) a Lead record
 *  5. Log the activity on the lead timeline
 *
 * Crawling, auditing, preview generation, QC, and email drafting (steps 5-13
 * of the inbound workflow) run asynchronously via the agent workflow engine
 * (see modules/agents) and are surfaced in the admin review queue.
 */
export async function processInboundLead(input: InboundLeadInput): Promise<InboundLeadResult> {
  const websiteUrl = input.websiteUrl?.trim() || null;

  const suppression = await checkSuppression({ email: input.email, websiteUrl });

  const inboundRequest = await prisma.inboundRequest.create({
    data: {
      name: input.name,
      businessName: input.businessName || null,
      websiteUrl,
      email: input.email,
      phone: input.phone || null,
      industry: input.industry || null,
      message: input.message || null,
      status: suppression ? "closed" : "new",
    },
  });

  if (suppression) {
    return { inboundRequestId: inboundRequest.id, status: "suppressed" };
  }

  // Without both a business name and website URL we can't run the crawl/audit
  // pipeline - store for manual review in the admin dashboard.
  if (!input.businessName || !websiteUrl) {
    return { inboundRequestId: inboundRequest.id, status: "stored_only" };
  }

  const existing = await prisma.lead.findFirst({
    where: { OR: [{ websiteUrl }, { contactEmail: input.email }] },
  });

  if (existing) {
    await prisma.inboundRequest.update({ where: { id: inboundRequest.id }, data: { leadId: existing.id } });
    await logActivity(
      existing.id,
      "inbound_request_received",
      `New inbound request from ${input.name} (${input.email}) via ${input.source}.`,
      { inboundRequestId: inboundRequest.id, source: input.source },
    );
    return { inboundRequestId: inboundRequest.id, leadId: existing.id, status: "linked_existing" };
  }

  const slug = await generateUniqueSlug(input.businessName);

  const lead = await prisma.lead.create({
    data: {
      businessName: input.businessName,
      slug,
      industry: input.industry || "other",
      websiteUrl,
      contactEmail: input.email,
      contactPhone: input.phone || null,
      contactPerson: input.name,
      source: input.source,
      status: "imported",
      notes: input.message || null,
    },
  });

  await prisma.inboundRequest.update({ where: { id: inboundRequest.id }, data: { leadId: lead.id } });
  await logActivity(lead.id, "lead_imported", `Lead created from inbound request (${input.source}).`, {
    inboundRequestId: inboundRequest.id,
  });

  return { inboundRequestId: inboundRequest.id, leadId: lead.id, status: "created" };
}
