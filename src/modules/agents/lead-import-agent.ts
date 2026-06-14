/**
 * Lead Import Agent.
 *
 * Validates and imports a batch of raw lead records (from CSV, manual entry, or
 * an API payload), deduplicating against existing leads and the suppression
 * list. Delegates the persistence to the shared csv-import module so the import
 * rules live in one place.
 */
import { z } from "zod";

import { importLeadsFromCsv } from "@/modules/lead-source/csv-import";
import type { CsvImportResult } from "@/modules/lead-source/csv-import";
import { Agent } from "./base-agent";

const recordSchema = z.object({
  businessName: z.string().min(1),
  industry: z.string().optional(),
  websiteUrl: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  contactPerson: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

const inputSchema = z.object({
  records: z.array(recordSchema).min(1),
});

const rowResultSchema = z.object({
  row: z.number(),
  businessName: z.string(),
  status: z.enum(["created", "skipped_duplicate", "skipped_suppressed", "error"]),
  message: z.string().optional(),
  leadId: z.string().optional(),
  slug: z.string().optional(),
});

const outputSchema = z.object({
  total: z.number(),
  created: z.number(),
  skipped: z.number(),
  errors: z.number(),
  rows: z.array(rowResultSchema),
});

export type LeadImportInput = z.infer<typeof inputSchema>;
export type LeadImportOutput = z.infer<typeof outputSchema>;

export class LeadImportAgent extends Agent<LeadImportInput, LeadImportOutput> {
  readonly name = "lead_import_agent";
  readonly description = "Validates, deduplicates, and imports a batch of lead records into the CRM.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = outputSchema;

  protected async execute(input: LeadImportInput): Promise<LeadImportOutput> {
    const result: CsvImportResult = await importLeadsFromCsv(input.records);
    return result;
  }
}

export const leadImportAgent = new LeadImportAgent();
