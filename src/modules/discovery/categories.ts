/**
 * Maps WLABS industries to Google Places Text Search query hints for Scope
 * Market discovery. Reuses the same INDUSTRIES list as the rest of the app so
 * the discovery category picker matches every other industry select.
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

/** Build a Google Places Text Search query for a city + industry, e.g. "dentist in Berlin". */
export function buildSearchQuery(city: string, industry: IndustryKey): string {
  return `${PLACES_QUERY_HINTS[industry]} in ${city}`;
}
