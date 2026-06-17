/**
 * Website Crawl Agent.
 *
 * Fetches a lead's homepage safely (SSRF-guarded, timeout + size capped) and
 * extracts the structured signals the audit engine needs. When fetch() is
 * blocked or fails, falls back to Apify cloud browser crawl if APIFY_TOKEN is
 * set. After any successful crawl, captures a screenshot via Apify.
 *
 * Transient failures (timeout / network) are thrown so the base agent retries;
 * permanent failures (blocked / invalid URL) with no Apify fallback are
 * non-retryable.
 */
import { z } from "zod";

import { crawlWithApify, screenshotWithApify } from "@/modules/crawler/apify";
import { extractWebsiteData, mergeImprintData } from "@/modules/crawler/extract";
import { fetchHomepage } from "@/modules/crawler/fetch";
import { Agent, NonRetryableError } from "./base-agent";
import { extractedWebsiteDataSchema } from "./schemas";

const inputSchema = z.object({
  websiteUrl: z.string().min(1),
  timeoutMs: z.number().optional(),
});

const outputSchema = z.object({
  crawlStatus: z.enum(["success", "failed", "blocked", "timeout", "invalid_url"]),
  finalUrl: z.string(),
  https: z.boolean(),
  errorMessage: z.string().nullable(),
  screenshotsAvailable: z.boolean(),
  screenshotUrl: z.string().nullable(),
  extractedData: extractedWebsiteDataSchema.nullable(),
});

export type WebsiteCrawlInput = z.infer<typeof inputSchema>;
export type WebsiteCrawlOutput = z.infer<typeof outputSchema>;

export class WebsiteCrawlAgent extends Agent<WebsiteCrawlInput, WebsiteCrawlOutput> {
  readonly name = "website_crawl_agent";
  readonly description = "Fetches a homepage safely and extracts metadata, contact details, and trust/local signals.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = outputSchema;
  readonly retryPolicy = { maxRetries: 2, backoffMs: 500 };

  protected async execute(input: WebsiteCrawlInput, ctx: { log: (l: "info" | "warn", m: string) => void }): Promise<WebsiteCrawlOutput> {
    const result = await fetchHomepage(input.websiteUrl, { timeoutMs: input.timeoutMs });

    if (result.ok) {
      ctx.log("info", `Fetched ${result.finalUrl} (${result.html.length} bytes)`);
      let data = extractWebsiteData(result.html, result.finalUrl);

      if (data.imprintUrl && data.imprintUrl !== result.finalUrl) {
        try {
          const imprint = await fetchHomepage(data.imprintUrl, { timeoutMs: input.timeoutMs });
          if (imprint.ok) {
            data = mergeImprintData(data, extractWebsiteData(imprint.html, imprint.finalUrl), imprint.finalUrl);
            ctx.log("info", `Found Impressum at ${imprint.finalUrl}`);
          }
        } catch {
          // Impressum fetch is best-effort.
        }
      }

      const screenshotUrl = await screenshotWithApify(result.finalUrl);
      if (screenshotUrl) ctx.log("info", "Screenshot captured via Apify");

      return {
        crawlStatus: "success",
        finalUrl: result.finalUrl,
        https: result.https,
        errorMessage: null,
        screenshotsAvailable: screenshotUrl !== null,
        screenshotUrl,
        extractedData: data,
      };
    }

    const reason = result.reason ?? "failed";
    const message = result.error ?? "Crawl failed";

    if (reason === "invalid_url") {
      throw new NonRetryableError(message, { code: reason });
    }

    // For blocked/failed, try Apify before giving up.
    if (reason === "blocked" || reason === "failed") {
      ctx.log("warn", `fetch() ${reason}; trying Apify fallback`);
      const apifyHtml = await crawlWithApify(input.websiteUrl);
      if (apifyHtml) {
        ctx.log("info", `Apify fallback succeeded (${apifyHtml.length} bytes)`);
        let data = extractWebsiteData(apifyHtml, input.websiteUrl);

        if (data.imprintUrl && data.imprintUrl !== input.websiteUrl) {
          try {
            const imprint = await fetchHomepage(data.imprintUrl, { timeoutMs: input.timeoutMs });
            if (imprint.ok) {
              data = mergeImprintData(data, extractWebsiteData(imprint.html, imprint.finalUrl), imprint.finalUrl);
            }
          } catch {
            // best-effort
          }
        }

        const screenshotUrl = await screenshotWithApify(input.websiteUrl);
        if (screenshotUrl) ctx.log("info", "Screenshot captured via Apify (fallback path)");

        return {
          crawlStatus: "success",
          finalUrl: input.websiteUrl,
          https: input.websiteUrl.startsWith("https://"),
          errorMessage: null,
          screenshotsAvailable: screenshotUrl !== null,
          screenshotUrl,
          extractedData: data,
        };
      }
      ctx.log("warn", "Apify fallback also failed or not configured");
    }

    if (reason === "blocked") {
      throw new NonRetryableError(message, { code: reason });
    }

    const error = new Error(message);
    error.name = reason;
    throw error;
  }
}

export const websiteCrawlAgent = new WebsiteCrawlAgent();
