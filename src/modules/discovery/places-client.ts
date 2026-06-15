/**
 * Google Places API (New) client for Scope Market discovery.
 *
 * Wraps Text Search (one page per call) and Place Details (fallback lookup
 * for results missing website/phone). When GOOGLE_PLACES_API_KEY is unset,
 * both functions return a small deterministic fixture set so the
 * discover -> import -> pipeline flow runs locally with zero external calls,
 * consistent with the AI_PROVIDER="mock" philosophy used elsewhere.
 */
import type { PlaceSearchResult } from "./types";

const PLACES_API_BASE = "https://places.googleapis.com/v1";

const SEARCH_FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.types,places.businessStatus," +
  "places.websiteUri,places.internationalPhoneNumber,places.addressComponents,nextPageToken";

const DETAILS_FIELD_MASK = "id,displayName,formattedAddress,websiteUri,internationalPhoneNumber,addressComponents";

export interface PlacesSearchPage {
  places: PlaceSearchResult[];
  nextPageToken: string | null;
}

/** Thrown for non-2xx Places API responses. `status` lets callers distinguish retryable (429/5xx) from permanent (4xx) failures. */
export class PlacesApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "PlacesApiError";
    this.status = status;
  }
}

interface GoogleAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface GooglePlace {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  types?: string[];
  businessStatus?: string;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  addressComponents?: GoogleAddressComponent[];
}

function addressComponent(place: GooglePlace, type: string): string | null {
  return place.addressComponents?.find((c) => c.types?.includes(type))?.longText ?? null;
}

function normalizePlace(place: GooglePlace): PlaceSearchResult {
  return {
    placeId: place.id,
    name: place.displayName?.text ?? "Unknown business",
    formattedAddress: place.formattedAddress ?? null,
    types: place.types ?? [],
    businessStatus: place.businessStatus ?? null,
    websiteUrl: place.websiteUri ?? null,
    phone: place.internationalPhoneNumber ?? null,
    city: addressComponent(place, "locality"),
    country: addressComponent(place, "country"),
  };
}

function apiKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY || undefined;
}

/** Whether a real Google Places API key is configured. False means Scope Market returns deterministic mock/demo places. */
export function isPlacesApiConfigured(): boolean {
  return Boolean(apiKey());
}

/** Search for places by free-text query (e.g. "dentist in Berlin, Germany"). One page per call. */
export async function searchPlacesByText(options: {
  query: string;
  pageToken?: string;
  languageCode?: string;
  regionCode?: string;
}): Promise<PlacesSearchPage> {
  const key = apiKey();
  if (!key) return mockSearchPlacesByText(options);

  const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: options.query,
      pageToken: options.pageToken,
      languageCode: options.languageCode,
      regionCode: options.regionCode,
    }),
  });

  if (!res.ok) {
    throw new PlacesApiError(`Places Text Search failed: ${res.status} ${await res.text()}`, res.status);
  }

  const data = (await res.json()) as { places?: GooglePlace[]; nextPageToken?: string };
  return {
    places: (data.places ?? []).map(normalizePlace),
    nextPageToken: data.nextPageToken ?? null,
  };
}

/** Fetch place details - fallback for results missing website/phone in the search response. */
export async function getPlaceDetails(placeId: string): Promise<PlaceSearchResult> {
  const key = apiKey();
  if (!key) return mockGetPlaceDetails(placeId);

  const res = await fetch(`${PLACES_API_BASE}/places/${placeId}`, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": DETAILS_FIELD_MASK,
    },
  });

  if (!res.ok) {
    throw new PlacesApiError(`Place Details failed: ${res.status} ${await res.text()}`, res.status);
  }

  return normalizePlace((await res.json()) as GooglePlace);
}

// ---------------------------------------------------------------------------
// Mock fixtures (GOOGLE_PLACES_API_KEY unset) - deterministic, zero network.
// ---------------------------------------------------------------------------

function slugifyMock(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "biz";
}

function titleCaseMock(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Country-code phone prefixes for DACH regionCodes, so mock results match the searched region. Falls back to a US prefix. */
const MOCK_PHONE_PREFIXES: Record<string, string> = {
  DE: "+49 30",
  AT: "+43 1",
  CH: "+41 44",
};

function mockPhone(regionCode: string | undefined, line: string): string {
  const prefix = (regionCode && MOCK_PHONE_PREFIXES[regionCode]) || "+1 555";
  return `${prefix} ${line}`;
}

/** First page of mock results for a query: a mix of places with/without a website or phone. */
function mockPage1(query: string, regionCode?: string): PlaceSearchResult[] {
  const slug = slugifyMock(query);
  const label = titleCaseMock(query);
  return [
    {
      placeId: `mock-${slug}-1`,
      name: `${label} Studio`,
      formattedAddress: "12 High Street",
      types: ["establishment"],
      businessStatus: "OPERATIONAL",
      websiteUrl: `https://${slug}-studio.example.com`,
      phone: mockPhone(regionCode, "010-0001"),
      city: null,
      country: null,
    },
    {
      placeId: `mock-${slug}-2`,
      name: `${label} Group`,
      formattedAddress: "48 Market Square",
      types: ["establishment"],
      businessStatus: "OPERATIONAL",
      websiteUrl: `https://${slug}-group.example.com`,
      phone: mockPhone(regionCode, "010-0002"),
      city: null,
      country: null,
    },
    {
      placeId: `mock-${slug}-3`,
      name: `${label} Center`,
      formattedAddress: "7 Old Town Road",
      types: ["establishment"],
      businessStatus: "OPERATIONAL",
      websiteUrl: null,
      phone: mockPhone(regionCode, "010-0003"),
      city: null,
      country: null,
    },
    {
      placeId: `mock-${slug}-4`,
      name: `${label} Associates`,
      formattedAddress: "200 Riverside Ave",
      types: ["establishment"],
      businessStatus: "OPERATIONAL",
      websiteUrl: `https://${slug}-associates.example.com`,
      phone: null,
      city: null,
      country: null,
    },
  ];
}

/** Second page of mock results - returned when a (mock) page token is supplied. */
function mockPage2(query: string, regionCode?: string): PlaceSearchResult[] {
  const slug = slugifyMock(query);
  const label = titleCaseMock(query);
  return [
    {
      placeId: `mock-${slug}-5`,
      name: `${label} Partners`,
      formattedAddress: "19 Station Road",
      types: ["establishment"],
      businessStatus: "OPERATIONAL",
      websiteUrl: `https://${slug}-partners.example.com`,
      phone: mockPhone(regionCode, "010-0005"),
      city: null,
      country: null,
    },
    {
      placeId: `mock-${slug}-6`,
      name: `${label} Direct`,
      formattedAddress: "3 Harbor View",
      types: ["establishment"],
      businessStatus: "OPERATIONAL",
      websiteUrl: null,
      phone: null,
      city: null,
      country: null,
    },
  ];
}

function mockSearchPlacesByText(options: { query: string; pageToken?: string; regionCode?: string }): PlacesSearchPage {
  if (!options.pageToken) {
    return {
      places: mockPage1(options.query, options.regionCode),
      nextPageToken: `mock-${slugifyMock(options.query)}-page2`,
    };
  }
  return { places: mockPage2(options.query, options.regionCode), nextPageToken: null };
}

function mockGetPlaceDetails(placeId: string): PlaceSearchResult {
  const label = titleCaseMock(placeId.replace(/^mock-/, "").replace(/-\d+$/, "").replace(/-/g, " "));
  return {
    placeId,
    name: label,
    formattedAddress: null,
    types: ["establishment"],
    businessStatus: "OPERATIONAL",
    websiteUrl: null,
    phone: "+1 555-010-0099",
    city: null,
    country: null,
  };
}
