import { test } from "node:test";
import assert from "node:assert/strict";

import { extractContactPerson, extractWebsiteData, findImprintUrl, mergeImprintData } from "@/modules/crawler/extract";

const HOMEPAGE_HTML = `
<!DOCTYPE html>
<html lang="de">
<head>
  <title>Mustermann Sanitär GmbH</title>
  <meta name="description" content="Ihr Sanitär- und Heizungsbetrieb in Berlin.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <header>
    <nav>
      <a href="/">Start</a>
      <a href="/leistungen">Leistungen</a>
      <a href="/kontakt">Kontakt</a>
      <a href="/impressum">Impressum</a>
    </nav>
  </header>
  <main>
    <h1>Mustermann Sanitär GmbH</h1>
    <p>Wir sind Ihr zuverlässiger Partner für Sanitär- und Heizungstechnik in Berlin und Umgebung seit über 20 Jahren.</p>
    <a href="/kontakt" class="cta">Jetzt Kontakt aufnehmen</a>
  </main>
</body>
</html>
`;

const IMPRINT_HTML = `
<!DOCTYPE html>
<html lang="de">
<head><title>Impressum - Mustermann Sanitär GmbH</title></head>
<body>
  <main>
    <h1>Impressum</h1>
    <p>Mustermann Sanitär GmbH</p>
    <p>Musterstraße 1, 10115 Berlin</p>
    <p>Geschäftsführer: Max Mustermann</p>
    <p>E-Mail: info@mustermann-sanitaer.example</p>
    <p>Telefon: +49 30 1234567</p>
  </main>
</body>
</html>
`;

test("findImprintUrl resolves an Impressum link to an absolute URL", () => {
  const url = findImprintUrl(HOMEPAGE_HTML, "https://mustermann-sanitaer.example/");
  assert.equal(url, "https://mustermann-sanitaer.example/impressum");
});

test("findImprintUrl returns null when no Impressum link is present", () => {
  assert.equal(findImprintUrl(IMPRINT_HTML, "https://mustermann-sanitaer.example/impressum"), null);
});

test("findImprintUrl ignores same-page anchors and matches on href when text is generic", () => {
  const sameAnchor = `<a href="#impressum">Rechtliches</a>`;
  assert.equal(findImprintUrl(sameAnchor, "https://example.com/"), null);

  const hrefMatch = `<a href="/legal/impressum.html">Rechtliches</a>`;
  assert.equal(findImprintUrl(hrefMatch, "https://example.com/"), "https://example.com/legal/impressum.html");
});

test("extractContactPerson returns null when the page has no responsible-person line", () => {
  assert.equal(extractContactPerson(HOMEPAGE_HTML), null);
});

test("extractContactPerson reads the name on a 'Geschäftsführer:' line without bleeding into the next line", () => {
  // Regression: a flattened-text match would greedily capture "Max Mustermann E-Mail"
  // because "E-Mail" also looks like a capitalized word - line-based matching avoids this.
  assert.equal(extractContactPerson(IMPRINT_HTML), "Max Mustermann");
});

test("extractContactPerson handles the '...nach § 55 Abs. 2 RStV:' phrasing", () => {
  const html = `<p>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: Erika Musterfrau</p>`;
  assert.equal(extractContactPerson(html), "Erika Musterfrau");
});

test("extractContactPerson stops at a comma and handles chained labels", () => {
  const withAddress = `<p>Inhaber: Peter Schmidt, Musterstraße 1, 12345 Musterstadt</p>`;
  assert.equal(extractContactPerson(withAddress), "Peter Schmidt");

  const chained = `<p>Vertretungsberechtigter Geschäftsführer: Käthe Müller-Schmidt</p>`;
  assert.equal(extractContactPerson(chained), "Käthe Müller-Schmidt");
});

test("extractContactPerson supports the generic English labels", () => {
  const html = `<p>Represented by: John Smith</p>`;
  assert.equal(extractContactPerson(html), "John Smith");
});

test("extractWebsiteData populates contactPerson and imprintUrl", () => {
  const homepage = extractWebsiteData(HOMEPAGE_HTML, "https://mustermann-sanitaer.example/");
  assert.equal(homepage.imprintUrl, "https://mustermann-sanitaer.example/impressum");
  assert.equal(homepage.contactPerson, null);
  assert.equal(homepage.title, "Mustermann Sanitär GmbH");
  assert.equal(homepage.hasViewportMeta, true);

  const imprint = extractWebsiteData(IMPRINT_HTML, "https://mustermann-sanitaer.example/impressum");
  assert.equal(imprint.contactPerson, "Max Mustermann");
  assert.equal(imprint.imprintUrl, null);
  assert.ok(imprint.emails.includes("info@mustermann-sanitaer.example"));
  assert.ok(imprint.hasPhone);
});

test("mergeImprintData prefers Impressum contact details and sets imprintUrl", () => {
  const homepage = extractWebsiteData(HOMEPAGE_HTML, "https://mustermann-sanitaer.example/");
  const imprint = extractWebsiteData(IMPRINT_HTML, "https://mustermann-sanitaer.example/impressum");

  const merged = mergeImprintData(homepage, imprint, "https://mustermann-sanitaer.example/impressum");

  assert.equal(merged.contactPerson, "Max Mustermann");
  assert.equal(merged.imprintUrl, "https://mustermann-sanitaer.example/impressum");
  assert.equal(merged.emails[0], "info@mustermann-sanitaer.example");
  assert.equal(merged.hasEmail, true);
  assert.equal(merged.hasPhone, true);
});
