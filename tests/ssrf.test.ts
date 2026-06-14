import { test } from "node:test";
import assert from "node:assert/strict";

import { assertSafeUrl, isPrivateIp, UnsafeUrlError } from "@/modules/crawler/ssrf";

test("isPrivateIp flags loopback/private/link-local", () => {
  for (const ip of ["127.0.0.1", "10.0.0.5", "172.16.0.1", "192.168.1.1", "169.254.169.254", "::1"]) {
    assert.equal(isPrivateIp(ip), true, ip);
  }
});

test("isPrivateIp allows public addresses", () => {
  for (const ip of ["8.8.8.8", "1.1.1.1", "140.82.121.3"]) {
    assert.equal(isPrivateIp(ip), false, ip);
  }
});

test("assertSafeUrl blocks unsafe URLs", async () => {
  for (const url of ["http://localhost/", "http://127.0.0.1/", "http://169.254.169.254/", "http://10.0.0.1/", "ftp://example.com/", "https://[::1]/"]) {
    await assert.rejects(() => assertSafeUrl(url), UnsafeUrlError, url);
  }
});

test("assertSafeUrl allows a public host", async () => {
  const url = await assertSafeUrl("https://github.com/");
  assert.equal(url.protocol, "https:");
});
