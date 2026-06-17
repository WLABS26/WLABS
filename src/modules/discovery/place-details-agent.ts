/**
 * Place Details Agent.
 *
 * Fallback lookup for a single Google Place when the Text Search result was
 * missing a website or phone number. Throws NonRetryableError for permanent
 * failures (4xx, except 429) so the base agent fails fast; rethrows 429/5xx
 * so the base agent retries with backoff.
 */
import { z } from "zod";

import { Agent, NonRetryableError } from "@/modules/agents/base-agent";

import { getPlaceDetails, PlacesApiError } from "./places-client";

const inputSchema = z.object({
  placeId: z.string().min(1),
});

const outputSchema = z.object({
  websiteUrl: z.string().nullable(),
  phone: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
});

export type PlaceDetailsInput = z.infer<typeof inputSchema>;
export type PlaceDetailsOutput = z.infer<typeof outputSchema>;

export class PlaceDetailsAgent extends Agent<PlaceDetailsInput, PlaceDetailsOutput> {
  readonly name = "place_details_agent";
  readonly description = "Looks up the website and phone for a place missing those fields from the search result.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = outputSchema;

  protected async execute(input: PlaceDetailsInput): Promise<PlaceDetailsOutput> {
    try {
      const place = await getPlaceDetails(input.placeId);
      return { websiteUrl: place.websiteUrl, phone: place.phone, city: place.city, country: place.country };
    } catch (err) {
      if (err instanceof PlacesApiError) {
        if (err.status === 429 || err.status >= 500) throw err;
        throw new NonRetryableError(err.message, { code: String(err.status) });
      }
      throw err;
    }
  }
}

export const placeDetailsAgent = new PlaceDetailsAgent();
