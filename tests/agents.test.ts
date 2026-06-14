import { test } from "node:test";
import assert from "node:assert/strict";

import { leadQualificationAgent } from "@/modules/agents/lead-qualification-agent";
import { emailDraftingAgent } from "@/modules/agents/email-drafting-agent";
import { emailQcAgent } from "@/modules/agents/email-qc-agent";
import { previewQcAgent } from "@/modules/agents/preview-qc-agent";

const baseQual = { businessName: "A", industry: "dentist", websiteUrl: "https://a.com", contactEmail: "a@a.com", contactPhone: null, doNotContact: false, isSuppressed: false, isDuplicate: false };

test("qualification: ready / suppressed / no-website / no-contact", async () => {
  assert.equal((await leadQualificationAgent.run(baseQual)).output?.qualificationStatus, "ready_for_crawl");
  assert.equal((await leadQualificationAgent.run({ ...baseQual, isSuppressed: true })).output?.qualificationStatus, "rejected");
  assert.equal((await leadQualificationAgent.run({ ...baseQual, websiteUrl: null })).output?.qualificationStatus, "needs_manual_review");
  assert.equal((await leadQualificationAgent.run({ ...baseQual, contactEmail: null })).output?.qualificationStatus, "rejected");
});

test("base agent returns failed (not throw) on invalid input", async () => {
  const r = await leadQualificationAgent.run({ businessName: "only" });
  assert.equal(r.status, "failed");
});

test("email drafting includes preview link, opt-out, price, personalization", async () => {
  const r = await emailDraftingAgent.run({
    businessName: "Smile Co", contactPerson: "Jane Doe", city: "Leeds", industryLabel: "Dentist",
    auditScore: 48, topIssues: ["No mobile CTA", "Hidden phone"], previewUrl: "https://wlabs.co/preview/smile-co?token=abc",
    bookingUrl: "https://cal.com/x", price: 999, currency: "EUR", senderName: "Alex", variant: "direct_preview",
  });
  const o = r.output!;
  assert.match(o.body, /preview\/smile-co/);
  assert.match(o.body.toLowerCase(), /no thanks/);
  assert.match(o.body, /999/);
  assert.match(o.body, /Smile Co/);
  assert.equal(o.status, "draft");
});

test("email QC fails when preview link or opt-out missing", async () => {
  const fail = await emailQcAgent.run({ subject: "Hi", body: "No link here", businessName: "X", hasPreviewLink: false, isSuppressed: false });
  assert.equal(fail.output?.qcStatus, "failed");
  const supp = await emailQcAgent.run({ subject: "Hi", body: 'reply "no thanks" https://x', businessName: "X", hasPreviewLink: true, isSuppressed: true });
  assert.equal(supp.output?.qcStatus, "failed");
});

test("preview QC passes good content, fails on name mismatch", async () => {
  const good = await previewQcAgent.run({
    expectedBusinessName: "Smile Co", expectedIndustry: "dentist", headline: "Smile Co in Leeds",
    ctaLabel: "Book now", servicesCount: 3, trustNote: "neutral placeholders only", trustItems: ["Local"],
    metaBusinessName: "Smile Co", metaIndustry: "dentist", city: "Leeds",
  });
  assert.equal(good.output?.qcStatus, "passed");

  const bad = await previewQcAgent.run({
    expectedBusinessName: "Smile Co", expectedIndustry: "dentist", headline: "Welcome",
    ctaLabel: "", servicesCount: 0, trustNote: "best in town guaranteed", trustItems: ["#1"],
    metaBusinessName: "Other Co", metaIndustry: "plumber", city: null,
  });
  assert.equal(bad.output?.qcStatus, "failed");
  assert.ok((bad.output?.qcIssues.length ?? 0) > 0);
});
