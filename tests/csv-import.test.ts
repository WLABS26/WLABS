import { test } from "node:test";
import assert from "node:assert/strict";

import { parseCsv, parseCsvRecords } from "@/modules/lead-source/csv-import";

test("parseCsv handles quotes, escaped quotes, and CRLF", () => {
  const rows = parseCsv('a,b,c\r\n"x,1","say ""hi""",z\n');
  assert.deepEqual(rows[0], ["a", "b", "c"]);
  assert.deepEqual(rows[1], ["x,1", 'say "hi"', "z"]);
});

test("parseCsvRecords maps aliased headers and requires businessName", () => {
  const csv = "Company,Website,Email\nAcme Ltd,acme.com,info@acme.com\n,nobody.com,x@y.com\n";
  const records = parseCsvRecords(csv);
  assert.equal(records.length, 1);
  assert.equal(records[0].businessName, "Acme Ltd");
  assert.equal(records[0].websiteUrl, "acme.com");
  assert.equal(records[0].contactEmail, "info@acme.com");
});

test("parseCsvRecords ignores unknown columns and blank rows", () => {
  const csv = "name,foo,phone\nBob's Cafe,ignore,+44 123\n\n";
  const records = parseCsvRecords(csv);
  assert.equal(records.length, 1);
  assert.equal(records[0].businessName, "Bob's Cafe");
  assert.equal(records[0].contactPhone, "+44 123");
});
