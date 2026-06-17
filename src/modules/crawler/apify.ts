/**
 * Apify fallback crawler for sites that block fetch().
 *
 * Both functions return null silently when APIFY_TOKEN is not configured,
 * so the pipeline degrades gracefully to fetch()-only mode.
 */

const APIFY_BASE = "https://api.apify.com/v2";

function apifyHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.APIFY_TOKEN}`,
  };
}

/**
 * Full browser crawl via apify~web-scraper when fetch() is blocked.
 * Runs real Chromium in Apify cloud; returns the rendered HTML string.
 */
export async function crawlWithApify(url: string): Promise<string | null> {
  if (!process.env.APIFY_TOKEN) return null;
  try {
    const res = await fetch(
      `${APIFY_BASE}/acts/apify~web-scraper/run-sync-get-dataset-items?timeout=60`,
      {
        method: "POST",
        headers: apifyHeaders(),
        body: JSON.stringify({
          startUrls: [{ url }],
          pageFunction: `async function pageFunction(context) {
  const { page, request } = context;
  try { await page.waitForNetworkIdle({ idleTime: 500 }); } catch {}
  return { html: await page.content(), url: request.loadedUrl };
}`,
          maxRequestsPerCrawl: 1,
          useChrome: false,
        }),
        signal: AbortSignal.timeout(90_000),
      },
    );
    if (!res.ok) return null;
    const items = (await res.json()) as Array<{ html?: string }>;
    return items[0]?.html ?? null;
  } catch {
    return null;
  }
}

/**
 * Screenshot-only capture via the apify~screenshot-url actor.
 * Returns a temporary HTTPS URL hosted on Apify's storage (valid ~24h).
 */
export async function screenshotWithApify(url: string): Promise<string | null> {
  if (!process.env.APIFY_TOKEN) return null;
  try {
    const res = await fetch(
      `${APIFY_BASE}/acts/apify~screenshot-url/run-sync-get-dataset-items?timeout=30`,
      {
        method: "POST",
        headers: apifyHeaders(),
        body: JSON.stringify({
          urls: [{ url }],
          waitUntil: "networkidle2",
          delay: 1000,
          fullPage: false,
        }),
        signal: AbortSignal.timeout(60_000),
      },
    );
    if (!res.ok) return null;
    const items = (await res.json()) as Array<{ screenshotUrl?: string }>;
    return items[0]?.screenshotUrl ?? null;
  } catch {
    return null;
  }
}
