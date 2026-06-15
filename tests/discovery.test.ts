import { test } from "node:test";
import assert from "node:assert/strict";

import { buildSearchQuery, resolveLanguageCode, resolveRegionCode } from "@/modules/discovery/categories";
import { searchPlacesByText } from "@/modules/discovery/places-client";
import { placesDiscoveryAgent } from "@/modules/discovery/places-discovery-agent";

test("resolveRegionCode defaults to Germany and maps DACH synonyms", () => {
  assert.equal(resolveRegionCode(undefined), "DE");
  assert.equal(resolveRegionCode(""), "DE");
  assert.equal(resolveRegionCode("Germany"), "DE");
  assert.equal(resolveRegionCode("Austria"), "AT");
  assert.equal(resolveRegionCode("Switzerland"), "CH");
  assert.equal(resolveRegionCode("Österreich"), "AT");
  assert.equal(resolveRegionCode("United Kingdom"), undefined);
});

test("resolveLanguageCode returns 'de' for DACH region codes only", () => {
  assert.equal(resolveLanguageCode("DE"), "de");
  assert.equal(resolveLanguageCode("AT"), "de");
  assert.equal(resolveLanguageCode("CH"), "de");
  assert.equal(resolveLanguageCode(undefined), undefined);
  assert.equal(resolveLanguageCode("GB"), undefined);
});

test("buildSearchQuery includes the country when provided", () => {
  assert.equal(buildSearchQuery("Berlin", "dentist"), "dentist in Berlin");
  assert.equal(buildSearchQuery("Berlin", "dentist", "Germany"), "dentist in Berlin, Germany");
  assert.equal(buildSearchQuery("Vienna", "plumber", "Austria"), "plumber in Vienna, Austria");
});

test("searchPlacesByText mock mode flavors phone numbers by region", async () => {
  const de = await searchPlacesByText({ query: "dentist in Berlin, Germany", regionCode: "DE" });
  assert.ok(de.places.every((p) => p.phone === null || p.phone.startsWith("+49 30")));
  assert.ok(de.places.some((p) => p.phone?.startsWith("+49 30")));

  const at = await searchPlacesByText({ query: "plumber in Vienna, Austria", regionCode: "AT" });
  assert.ok(at.places.some((p) => p.phone?.startsWith("+43 1")));

  const ch = await searchPlacesByText({ query: "lawyer in Zurich, Switzerland", regionCode: "CH" });
  assert.ok(ch.places.some((p) => p.phone?.startsWith("+41 44")));

  const fallback = await searchPlacesByText({ query: "dentist in London" });
  assert.ok(fallback.places.some((p) => p.phone?.startsWith("+1 555")));
});

test("searchPlacesByText mock mode threads regionCode through pagination", async () => {
  const page1 = await searchPlacesByText({ query: "dentist in Berlin, Germany", regionCode: "DE" });
  assert.ok(page1.nextPageToken);

  const page2 = await searchPlacesByText({ query: "dentist in Berlin, Germany", pageToken: page1.nextPageToken!, regionCode: "DE" });
  assert.ok(page2.places.some((p) => p.phone?.startsWith("+49 30")));
  assert.equal(page2.nextPageToken, null);
});

test("placesDiscoveryAgent defaults to Germany and biases mock results to DACH phone numbers", async () => {
  const result = await placesDiscoveryAgent.run({ city: "Berlin", industry: "dentist" });
  assert.equal(result.status, "completed");
  assert.ok(result.output!.places.length > 0);
  assert.ok(result.output!.places.some((p) => p.phone?.startsWith("+49")));
});

test("placesDiscoveryAgent biases mock results to Austria when country is set", async () => {
  const result = await placesDiscoveryAgent.run({ city: "Vienna", country: "Austria", industry: "plumber" });
  assert.equal(result.status, "completed");
  assert.ok(result.output!.places.some((p) => p.phone?.startsWith("+43")));
});
