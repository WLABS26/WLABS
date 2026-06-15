import { Prisma } from "@/generated/prisma/client";
import type { Lead, LeadStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/modules/crm/activity";
import { buildIntakeUrl, getLatestPreviewForLead } from "@/modules/generator/preview-store";

const DEFAULT_PAGE_SIZE = 20;

export interface ListLeadsFilters {
  status?: LeadStatus | LeadStatus[];
  industry?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  orderBy?: Prisma.LeadOrderByWithRelationInput;
}

export interface ListLeadsResult {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * List leads for the admin pipeline view, with optional status/industry
 * filters, a free-text search across business/contact fields, and pagination.
 */
export async function listLeads(filters: ListLeadsFilters = {}): Promise<ListLeadsResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : DEFAULT_PAGE_SIZE;

  const where: Prisma.LeadWhereInput = {};

  if (filters.status) {
    where.status = Array.isArray(filters.status) ? { in: filters.status } : filters.status;
  }

  if (filters.industry) {
    where.industry = filters.industry;
  }

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { businessName: { contains: search, mode: "insensitive" } },
      { contactEmail: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
      { websiteUrl: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: filters.orderBy ?? { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    leads,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Fetch a single lead by slug with its full activity timeline and related records for the detail page. */
export async function getLeadBySlug(slug: string) {
  return prisma.lead.findUnique({
    where: { slug },
    include: {
      activities: { orderBy: { createdAt: "desc" } },
      audits: { orderBy: { createdAt: "desc" } },
      previews: { orderBy: { createdAt: "desc" } },
      emailDrafts: { orderBy: { createdAt: "desc" } },
      workflowSteps: { orderBy: { createdAt: "desc" }, include: { workflowRun: true } },
      inboundRequests: { orderBy: { createdAt: "desc" } },
      intakeSubmissions: { orderBy: { createdAt: "desc" } },
    },
  });
}

export type LeadDetail = NonNullable<Awaited<ReturnType<typeof getLeadBySlug>>>;

/** Update a lead's CRM pipeline status and record it on the activity timeline. */
export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const lead = await prisma.lead.update({ where: { id: leadId }, data: { status } });

  const metadata: Record<string, unknown> = { status };
  if (status === "replied" || status === "booked_call") {
    const preview = await getLatestPreviewForLead(leadId);
    if (preview) metadata.intakeUrl = buildIntakeUrl(preview.slug, preview.token);
  }

  await logActivity(leadId, "status_changed", `Status changed to "${status.replace(/_/g, " ")}".`, metadata);
  return lead;
}

/** Requeue a rejected lead for re-review by moving it back to "qualified". */
export async function requeueRejectedLead(leadId: string) {
  const lead = await prisma.lead.update({ where: { id: leadId }, data: { status: "qualified" } });
  await logActivity(leadId, "lead_unrejected", "Lead requeued for re-review after being rejected.", { status: "qualified" });
  return lead;
}

/** Append a free-text note to a lead's activity timeline. */
export async function addLeadNote(leadId: string, note: string) {
  return logActivity(leadId, "note", note);
}

/** Permanently delete a lead. Related activities, audits, previews, etc. cascade via the schema's FK constraints. */
export async function deleteLead(leadId: string): Promise<void> {
  await prisma.lead.delete({ where: { id: leadId } });
}

export interface CreateLeadInput {
  businessName: string;
  industry: string;
  websiteUrl?: string | null;
  city?: string | null;
  country?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  source?: string;
}

/** Manually create a lead from the admin "New lead" form. */
export async function createLead(input: CreateLeadInput) {
  const slug = await generateUniqueSlug(input.businessName);

  const lead = await prisma.lead.create({
    data: {
      businessName: input.businessName,
      slug,
      industry: input.industry || "other",
      websiteUrl: input.websiteUrl?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || null,
      contactEmail: input.contactEmail?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
      contactPerson: input.contactPerson?.trim() || null,
      notes: input.notes?.trim() || null,
      source: input.source || "manual",
      status: "imported",
    },
  });

  await logActivity(lead.id, "lead_imported", "Lead created manually via the admin dashboard.");

  return lead;
}

/** Generate a unique, URL-safe slug for a lead based on its business name. */
export async function generateUniqueSlug(businessName: string) {
  const base = slugify(businessName) || "lead";
  let slug = base;
  let counter = 1;

  while (await prisma.lead.findUnique({ where: { slug } })) {
    counter += 1;
    slug = `${base}-${counter}`;
  }

  return slug;
}
