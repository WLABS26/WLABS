/**
 * Website Crawl Agent.
 *
 * Fetches a lead's homepage safely (SSRF-guarded, timeout + size capped) and
 * extracts the structured signals the audit engine needs. Screenshots require a
 * headless browser; when one is not configured the agent degrades gracefully
 * and reports `screenshotsAvailable: false` rather than failing.
 *
 * Transient failures (timeout / network) are thrown so the base agent retries;
 * permanent failures (blocked / invalid URL) are non-retryable.
 */
import { z } from "zod";

import { extractWebsiteData } from "@/modules/crawler/extract";
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
      return {
        crawlStatus: "success",
        finalUrl: result.finalUrl,
        https: result.https,
        errorMessage: null,
        screenshotsAvailable: false,
        extractedData: extractWebsiteData(result.html, result.finalUrl),
      };
    }

    const reason = result.reason ?? "failed";
    const message = result.error ?? "Crawl failed";

    // Permanent failures: do not waste retries.
    if (reason === "blocked" || reason === "invalid_url") {
      throw new NonRetryableError(message, { code: reason });
    }

    // Transient failures: throw with the reason as the error name so the base
    // agent retries and the pipeline can recover the CrawlStatus afterwards.
    const error = new Error(message);
    error.name = reason; // "timeout" | "failed"
    throw error;
  }
}

export const websiteCrawlAgent = new WebsiteCrawlAgent();
