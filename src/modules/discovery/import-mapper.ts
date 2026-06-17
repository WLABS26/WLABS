/**
 * Maps a Google Places search result to a CsvLeadRecord for the existing
 * lead-import pipeline (dedup, suppression, slug generation all reused as-is).
 */
import type { CsvLeadRecord } from "@/modules/lead-source/csv-import";
import type { IndustryKey } from "@/modules/shared/types";

import type { PlaceSearchResult } from "./types";

export function placeToImportRecord(place: PlaceSearchResult, industry: IndustryKey, city: string): CsvLeadRecord {
  return {
    businessName: place.name,
    industry,
    websiteUrl: place.websiteUrl ?? undefined,
    contactPhone: place.phone ?? undefined,
    city: place.city ?? city,
    country: place.country ?? undefined,
    source: "google_places_discovery",
    sourceUrl: `https://www.google.com/maps/place/?q=place_id:${place.placeId}`,
    discoverySourceId: place.placeId,
    discoveryCategory: industry,
    notes: `Discovered via Google Places${place.formattedAddress ? ` (${place.formattedAddress})` : ""}.`,
  };
}
