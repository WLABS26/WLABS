import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/modules/crm/activity";
import { generateUniqueSlug } from "@/modules/crm/leads";
import { checkSuppression } from "@/modules/lead-source/suppression";
import { INDUSTRIES } from "@/modules/shared/constants";

const VALID_INDUSTRIES = new Set<string>(INDUSTRIES.map((industry) => industry.value));

/**
 * Parse CSV text into rows of raw string cells.
 * Hand-rolled RFC4180-ish parser: supports quoted fields, escaped `""`
 * quotes within quoted fields, and both CRLF and LF line endings.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    switch (char) {
      case '"':
        inQuotes = true;
        break;
      case ",":
        row.push(field);
        field = "";
        break;
      case "\r":
        break;
      case "\n":
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        break;
      default:
        field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => !(cells.length === 1 && cells[0] === ""));
}

export interface CsvLeadRecord {
  businessName: string;
  industry?: string;
  websiteUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPerson?: string;
  city?: string;
  country?: string;
  notes?: string;
}

const COLUMN_ALIASES: Record<string, keyof CsvLeadRecord> = {
  businessname: "businessName",
  business_name: "businessName",
  business: "businessName",
  company: "businessName",
  name: "businessName",
  industry: "industry",
  category: "industry",
  websiteurl: "websiteUrl",
  website_url: "websiteUrl",
  website: "websiteUrl",
  url: "websiteUrl",
  contactemail: "contactEmail",
  contact_email: "contactEmail",
  email: "contactEmail",
  contactphone: "contactPhone",
  contact_phone: "contactPhone",
  phone: "contactPhone",
  contactperson: "contactPerson",
  contact_person: "contactPerson",
  contact: "contactPerson",
  contact_name: "contactPerson",
  city: "city",
  country: "country",
  notes: "notes",
  note: "notes",
};

/** Parse CSV text into lead records using a header row. Unknown columns are ignored. */
export function parseCsvRecords(text: string): CsvLeadRecord[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const header = rows[0].map((cell) => cell.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  const fieldKeys = header.map((key) => COLUMN_ALIASES[key] ?? null);

  const records: CsvLeadRecord[] = [];

  for (const row of rows.slice(1)) {
    if (row.every((cell) => cell.trim() === "")) continue;

    const record: Partial<CsvLeadRecord> = {};
    fieldKeys.forEach((key, index) => {
      if (!key) return;
      const value = row[index]?.trim();
      if (value) record[key] = value;
    });

    if (record.businessName) {
      records.push(record as CsvLeadRecord);
    }
  }

  return records;
}

function normalizeIndustry(value: string | undefined): string {
  if (!value) return "other";
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return VALID_INDUSTRIES.has(normalized) ? normalized : "other";
}

export interface CsvImportRowResult {
  row: number;
  businessName: string;
  status: "created" | "skipped_duplicate" | "skipped_suppressed" | "error";
  message?: string;
  leadId?: string;
  slug?: string;
}

export interface CsvImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  rows: CsvImportRowResult[];
}

/**
 * Import parsed CSV lead records into the CRM.
 * Skips rows that match the suppression list or an existing lead (by website
 * URL or contact email), defaults unrecognized industries to "other", and
 * logs a `lead_imported` activity for each created lead.
 */
export async function importLeadsFromCsv(records: CsvLeadRecord[]): Promise<CsvImportResult> {
  const rows: CsvImportRowResult[] = [];
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowNumber = i + 2; // +1 for 1-indexing, +1 for the header row
    const businessName = record.businessName?.trim() ?? "";

    try {
      if (!businessName) {
        errors++;
        rows.push({ row: rowNumber, businessName: "", status: "error", message: "Missing business name." });
        continue;
      }

      const websiteUrl = record.websiteUrl?.trim() || null;
      const contactEmail = record.contactEmail?.trim() || null;

      const suppression = await checkSuppression({ email: contactEmail, websiteUrl });
      if (suppression) {
        skipped++;
        rows.push({ row: rowNumber, businessName, status: "skipped_suppressed", message: "Matches suppression list." });
        continue;
      }

      const dedupeConditions: Prisma.LeadWhereInput[] = [];
      if (websiteUrl) dedupeConditions.push({ websiteUrl });
      if (contactEmail) dedupeConditions.push({ contactEmail });

      const existing =
        dedupeConditions.length > 0 ? await prisma.lead.findFirst({ where: { OR: dedupeConditions } }) : null;

      if (existing) {
        skipped++;
        rows.push({
          row: rowNumber,
          businessName,
          status: "skipped_duplicate",
          message: `Matches existing lead "${existing.businessName}".`,
          leadId: existing.id,
          slug: existing.slug,
        });
        continue;
      }

      const slug = await generateUniqueSlug(businessName);

      const lead = await prisma.lead.create({
        data: {
          businessName,
          slug,
          industry: normalizeIndustry(record.industry),
          websiteUrl,
          contactEmail,
          contactPhone: record.contactPhone?.trim() || null,
          contactPerson: record.contactPerson?.trim() || null,
          city: record.city?.trim() || null,
          country: record.country?.trim() || null,
          notes: record.notes?.trim() || null,
          source: "csv_import",
          status: "imported",
        },
      });

      await logActivity(lead.id, "lead_imported", "Lead imported from CSV.");

      created++;
      rows.push({ row: rowNumber, businessName, status: "created", leadId: lead.id, slug: lead.slug });
    } catch (err) {
      errors++;
      rows.push({
        row: rowNumber,
        businessName,
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error.",
      });
    }
  }

  return { total: records.length, created, skipped, errors, rows };
}

/** Convenience wrapper: parse raw CSV text and import the resulting records. */
export async function importLeadsFromCsvText(text: string): Promise<CsvImportResult> {
  return importLeadsFromCsv(parseCsvRecords(text));
}
