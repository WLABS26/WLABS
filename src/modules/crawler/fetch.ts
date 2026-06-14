/**
 * Safe homepage fetcher for the crawler.
 *
 * Wraps global fetch with SSRF validation, a hard timeout, a response-size cap,
 * and a desktop-like User-Agent. Returns a structured result instead of
 * throwing so the crawl agent can map failures onto CrawlStatus values.
 */
import { assertSafeUrl, UnsafeUrlError } from "./ssrf";

export interface FetchHomepageOptions {
  timeoutMs?: number;
  maxBytes?: number;
  userAgent?: string;
}

export type FetchFailureReason = "invalid_url" | "blocked" | "timeout" | "failed";

export interface FetchHomepageResult {
  ok: boolean;
  status: number;
  finalUrl: string;
  https: boolean;
  html: string;
  truncated: boolean;
  reason?: FetchFailureReason;
  error?: string;
}

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 WLABSBot/1.0";

/** Read a response body up to `maxBytes`, decoding as UTF-8. Flags truncation. */
async function readCappedBody(response: Response, maxBytes: number): Promise<{ html: string; truncated: boolean }> {
  if (!response.body) {
    const text = await response.text();
    const encoded = new TextEncoder().encode(text);
    if (encoded.byteLength <= maxBytes) return { html: text, truncated: false };
    return { html: new TextDecoder().decode(encoded.slice(0, maxBytes)), truncated: true };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let truncated = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      if (received >= maxBytes) {
        truncated = true;
        await reader.cancel();
        break;
      }
    }
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const slice = truncated ? merged.slice(0, maxBytes) : merged;
  return { html: new TextDecoder("utf-8", { fatal: false }).decode(slice), truncated };
}

/**
 * Fetch a homepage safely. Never throws - all failures are returned with a
 * `reason` the crawl agent can translate into a CrawlStatus.
 */
export async function fetchHomepage(rawUrl: string, options: FetchHomepageOptions = {}): Promise<FetchHomepageResult> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const maxBytes = options.maxBytes ?? 2_000_000;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;

  const empty = { html: "", truncated: false, https: false, status: 0, finalUrl: rawUrl };

  let url: URL;
  try {
    url = await assertSafeUrl(rawUrl);
  } catch (err) {
    const blocked = err instanceof UnsafeUrlError;
    return {
      ok: false,
      ...empty,
      reason: blocked ? "blocked" : "invalid_url",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": userAgent, Accept: "text/html,application/xhtml+xml" },
    });

    const finalUrl = response.url || url.toString();
    const https = finalUrl.startsWith("https:");
    const { html, truncated } = await readCappedBody(response, maxBytes);

    return {
      ok: response.ok,
      status: response.status,
      finalUrl,
      https,
      html,
      truncated,
      reason: response.ok ? undefined : "failed",
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      ...empty,
      https: url.protocol === "https:",
      reason: aborted ? "timeout" : "failed",
      error: aborted ? `Timed out after ${timeoutMs}ms` : err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}
