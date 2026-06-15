/**
 * Shared types for the Scope Market discovery module.
 */
import { z } from "zod";

import type { IndustryKey } from "@/modules/shared/types";

export const placeSearchResultSchema = z.object({
  placeId: z.string(),
  name: z.string(),
  formattedAddress: z.string().nullable(),
  types: z.array(z.string()),
  businessStatus: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  phone: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
});
export type PlaceSearchResult = z.infer<typeof placeSearchResultSchema>;

export interface ScopeMarketOptions {
  city: string;
  country?: string;
  industries: IndustryKey[];
  targetCount: number;
  createdBy?: string;
}

export interface ScopeMarketDiscoveryResult {
  discoveryRunId: string;
  workflowRunId: string;
  leadIds: string[];
  placesFound: number;
  imported: number;
  skippedDuplicate: number;
  skippedSuppressed: number;
  errors: number;
}

export interface ScopeMarketPipelineResult {
  discoveryRunId: string;
  processed: number;
  dedicatedSalesCount: number;
  prospectsCount: number;
}
