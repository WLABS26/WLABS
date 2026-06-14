import { test } from "node:test";
import assert from "node:assert/strict";

import { extractWebsiteData } from "@/modules/crawler/extract";
import { runAudit, determineOpportunity } from "@/modules/audit-engine/heuristics";

const OLD_HTML = `<!doctype html><html><head><title>Joe Plumbing</title></head>
<body><h1>Joe Plumbing</h1><p>We do plumbing. Call us.</p><img src="a.jpg"></body></html>`;

const MODERN_HTML = `<!doctype html><html><head>
<title>Bright Dental - Modern Family Dentist in Leeds</title>
<meta name="description" content="Modern family dentistry in Leeds. Book online.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/favicon.ico">
<script type="application/ld+json">{"@context":"https://schema.org"}</script></head><body>
<nav><a href="/">Home</a><a href="/services">Services</a><a href="/contact">Contact</a></nav>
<h1>Your Trusted Family Dentist in Leeds</h1>
<p>Comprehensive dental care for the whole family with the latest technology and a gentle approach.</p>
<p>Our team has served Leeds for over 20 years and patients rate us 5 stars in their reviews.</p>
<p>We make booking easy and our prices are clear and upfront for every treatment we offer.</p>
<a href="tel:+441135550100">Call us now</a><a href="/book">Book an appointment</a>
<form><input name="email"><button>Request a callback</button></form>
<address>12 High Street, Leeds, LS1 4AB</address>
<iframe src="https://www.google.com/maps/embed?pb=x"></iframe>
<p>Opening hours: Monday to Friday.</p>
<a href="https://facebook.com/x">Facebook</a>
<img src="1.jpg"><img src="2.jpg"><img src="3.jpg"><img src="4.jpg"><img src="5.jpg"></body></html>`;

test("extracts key signals from modern HTML", () => {
  const d = extractWebsiteData(MODERN_HTML, "https://x.test");
  assert.equal(d.hasViewportMeta, true);
  assert.equal(d.formsCount, 1);
  assert.equal(d.hasPhone, true);
  assert.equal(d.hasMapEmbed, true);
  assert.ok(d.addressHints.length > 0);
  assert.ok(d.h1?.includes("Family Dentist"));
});

test("modern site scores higher than old site", () => {
  const old = runAudit({ data: extractWebsiteData(OLD_HTML, "http://x.test"), businessName: "Joe", industryLabel: "Plumber", city: "Leeds", hasContact: true });
  const modern = runAudit({ data: extractWebsiteData(MODERN_HTML, "https://x.test"), businessName: "Bright Dental", industryLabel: "Dentist", city: "Leeds", hasContact: true });
  assert.ok(old.overallScore < modern.overallScore);
  assert.equal(old.qualificationStatus, "high_opportunity");
  assert.ok(modern.overallScore >= 70);
});

test("category scores always sum to overall", () => {
  const r = runAudit({ data: extractWebsiteData(MODERN_HTML, "https://x.test"), businessName: "x", industryLabel: "Dentist", city: "Leeds", hasContact: true });
  const sum = Object.values(r.categoryScores).reduce((a, b) => a + b, 0);
  assert.equal(sum, r.overallScore);
});

test("opportunity thresholds", () => {
  assert.equal(determineOpportunity(50, true), "high_opportunity");
  assert.equal(determineOpportunity(70, true), "medium_opportunity");
  assert.equal(determineOpportunity(80, true), "low_opportunity");
  assert.equal(determineOpportunity(50, false), "reject");
});
