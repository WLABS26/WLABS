/**
 * Maps WLABS industries to Google Places Text Search query hints for Scope
 * Market discovery, and resolves a target country to the Places API's
 * region/language codes. Reuses the same INDUSTRIES list as the rest of the
 * app so the discovery category picker matches every other industry select.
 */
import type { IndustryKey } from "@/modules/shared/types";

export const PLACES_QUERY_HINTS: Record<IndustryKey, string> = {
  dentist: "dentist",
  physiotherapist: "physiotherapy clinic",
  plumber: "plumber",
  electrician: "electrician",
  lawyer: "law firm",
  accountant: "accountant",
  real_estate: "real estate agency",
  restaurant: "restaurant",
  beauty_clinic: "beauty clinic",
  construction: "construction company",
  other: "local business",
};

/** Build a Google Places Text Search query for a city + industry, e.g. "dentist in Berlin, Germany". */
export function buildSearchQuery(city: string, industry: IndustryKey, country?: string | null): string {
  const location = country ? `${city}, ${country}` : city;
  return `${PLACES_QUERY_HINTS[industry]} in ${location}`;
}

/**
 * DACH country names/synonyms -> Places API regionCode (ISO 3166-1 alpha-2).
 * Scope Market defaults to Germany when no country is given: the DACH region
 * (Germany, Austria, Switzerland) legally requires an Impressum/legal-notice
 * page on every business website, which `crawler/extract.ts` mines for
 * contact details - so DACH leads consistently come back with a usable email
 * and contact person, unlike most other regions.
 */
const DACH_REGION_CODES: Record<string, string> = {
  germany: "DE",
  deutschland: "DE",
  de: "DE",
  austria: "AT",
  österreich: "AT",
  oesterreich: "AT",
  at: "AT",
  switzerland: "CH",
  schweiz: "CH",
  suisse: "CH",
  svizzera: "CH",
  ch: "CH",
};

/**
 * Resolve a free-text country to a Places API regionCode. Defaults to "DE"
 * when no country is given. Countries outside DACH return `undefined` (no
 * regionCode bias) - Places falls back to inferring location from the query
 * text, which already includes the country name via `buildSearchQuery`.
 */
export function resolveRegionCode(country?: string | null): string | undefined {
  const normalized = (country?.trim() || "germany").toLowerCase();
  return DACH_REGION_CODES[normalized];
}

/** languageCode for a regionCode - DACH countries search in German for more locally-relevant results. */
export function resolveLanguageCode(regionCode: string | undefined): string | undefined {
  return regionCode === "DE" || regionCode === "AT" || regionCode === "CH" ? "de" : undefined;
}
