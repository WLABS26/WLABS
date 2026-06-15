/**
 * Places Discovery Agent.
 *
 * Runs a single Google Places Text Search page for a city + industry. Throws
 * NonRetryableError for permanent failures (4xx, except 429) so the base
 * agent fails fast; rethrows 429/5xx so the base agent retries with backoff.
 */
import { z } from "zod";

import { Agent, NonRetryableError } from "@/modules/agents/base-agent";
import { INDUSTRIES } from "@/modules/shared/constants";
import type { IndustryKey } from "@/modules/shared/types";

import { buildSearchQuery } from "./categories";
import { PlacesApiError, searchPlacesByText } from "./places-client";
import { placeSearchResultSchema } from "./types";

const INDUSTRY_VALUES = INDUSTRIES.map((industry) => industry.value) as [IndustryKey, ...IndustryKey[]];

const inputSchema = z.object({
  city: z.string().min(1),
  industry: z.enum(INDUSTRY_VALUES),
  pageToken: z.string().optional(),
});

const outputSchema = z.object({
  places: z.array(placeSearchResultSchema),
  nextPageToken: z.string().nullable(),
});

export type PlacesDiscoveryInput = z.infer<typeof inputSchema>;
export type PlacesDiscoveryOutput = z.infer<typeof outputSchema>;

export class PlacesDiscoveryAgent extends Agent<PlacesDiscoveryInput, PlacesDiscoveryOutput> {
  readonly name = "places_discovery_agent";
  readonly description = "Searches Google Places for local businesses in a city/category (one search page per call).";
  readonly inputSchema = inputSchema;
  readonly outputSchema = outputSchema;

  protected async execute(input: PlacesDiscoveryInput): Promise<PlacesDiscoveryOutput> {
    const query = buildSearchQuery(input.city, input.industry);

    try {
      const page = await searchPlacesByText({ query, pageToken: input.pageToken });
      return { places: page.places, nextPageToken: page.nextPageToken };
    } catch (err) {
      if (err instanceof PlacesApiError) {
        if (err.status === 429 || err.status >= 500) throw err;
        throw new NonRetryableError(err.message, { code: String(err.status) });
      }
      throw err;
    }
  }
}

export const placesDiscoveryAgent = new PlacesDiscoveryAgent();
