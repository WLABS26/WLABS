/**
 * Lightweight HTML metadata extraction for the crawler.
 *
 * Deliberately dependency-free (regex over the raw HTML) so it runs anywhere
 * without a headless browser or DOM library. The goal is not perfect parsing
 * but a consistent set of signals for the audit engine: titles, headings,
 * contact details, navigation/CTA labels, trust/local signals, and counts.
 */

export interface ExtractedWebsiteData {
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  headings: string[];
  textSnippets: string[];
  navLabels: string[];
  ctaLabels: string[];
  emails: string[];
  phones: string[];
  socialLinks: string[];
  addressHints: string[];
  imagesCount: number;
  formsCount: number;
  linksCount: number;
  wordCount: number;
  https: boolean;
  hasViewportMeta: boolean;
  hasSchemaOrg: boolean;
  hasFavicon: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasMapEmbed: boolean;
}

const SOCIAL_DOMAINS = ["facebook.com", "instagram.com", "twitter.com", "x.com", "linkedin.com", "youtube.com", "tiktok.com"];
const CTA_KEYWORDS = [
  "contact", "book", "call", "quote", "get started", "request", "appointment", "enquire", "inquire",
  "order", "buy", "subscribe", "sign up", "schedule", "reserve", "free", "demo",
];

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 10)));
}

function clean(input: string): string {
  return decodeEntities(input.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function matchAll(html: string, regex: RegExp): RegExpMatchArray[] {
  return Array.from(html.matchAll(regex));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

/** Strip <script> and <style> blocks so their content never pollutes signals. */
function stripNonContent(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

export function extractWebsiteData(rawHtml: string, finalUrl: string): ExtractedWebsiteData {
  const html = stripNonContent(rawHtml);
  const lower = rawHtml.toLowerCase();

  const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? clean(titleMatch[1]) || null : null;

  const metaDescMatch =
    rawHtml.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i) ??
    rawHtml.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const metaDescription = metaDescMatch ? clean(metaDescMatch[1]) || null : null;

  const headingMatches = matchAll(html, /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi);
  const headings = unique(headingMatches.map((m) => clean(m[2])).filter(Boolean)).slice(0, 12);
  const h1Match = headingMatches.find((m) => m[1] === "1");
  const h1 = h1Match ? clean(h1Match[2]) || null : null;

  const paragraphs = matchAll(html, /<p[^>]*>([\s\S]*?)<\/p>/gi)
    .map((m) => clean(m[1]))
    .filter((t) => t.length > 30);
  const textSnippets = paragraphs.slice(0, 6);

  // Navigation labels: anchor text inside the first <nav> (or header) block.
  const navBlock = (html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i)?.[1] ?? html.match(/<header[^>]*>([\s\S]*?)<\/header>/i)?.[1]) ?? "";
  const navLabels = unique(
    matchAll(navBlock, /<a\b[^>]*>([\s\S]*?)<\/a>/gi)
      .map((m) => clean(m[1]))
      .filter((t) => t.length > 0 && t.length < 40),
  ).slice(0, 15);

  // CTA labels: anchor/button text matching common call-to-action keywords.
  const anchorAndButtonText = matchAll(html, /<(?:a|button)\b[^>]*>([\s\S]*?)<\/(?:a|button)>/gi)
    .map((m) => clean(m[1]))
    .filter(Boolean);
  const ctaLabels = unique(
    anchorAndButtonText.filter((text) => {
      const t = text.toLowerCase();
      return text.length < 40 && CTA_KEYWORDS.some((kw) => t.includes(kw));
    }),
  ).slice(0, 12);

  const emails = unique(
    matchAll(rawHtml, /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi).map((m) => m[0].toLowerCase()),
  ).filter((e) => !e.endsWith(".png") && !e.endsWith(".jpg")).slice(0, 10);

  const telLinks = matchAll(rawHtml, /href=["']tel:([^"']+)["']/gi).map((m) => decodeEntities(m[1]).trim());
  const phoneText = matchAll(rawHtml, /(?:\+?\d[\d\s().-]{7,}\d)/g).map((m) => m[0].trim());
  const phones = unique([...telLinks, ...phoneText]).slice(0, 8);

  const socialLinks = unique(
    matchAll(rawHtml, /href=["'](https?:\/\/[^"']+)["']/gi)
      .map((m) => m[1])
      .filter((href) => SOCIAL_DOMAINS.some((d) => href.toLowerCase().includes(d))),
  ).slice(0, 10);

  const addressHints = unique(
    paragraphs
      .concat(matchAll(html, /<address[^>]*>([\s\S]*?)<\/address>/gi).map((m) => clean(m[1])))
      .filter((t) => /\b[A-Z]{1,2}\d[\dA-Z]?\s?\d[A-Z]{2}\b/.test(t) || /\b\d{5}\b/.test(t) || /\b(street|st\.|road|rd\.|avenue|ave|lane|drive|suite)\b/i.test(t)),
  ).slice(0, 5);

  const imagesCount = matchAll(html, /<img\b/gi).length;
  const formsCount = matchAll(html, /<form\b/gi).length;
  const linksCount = matchAll(html, /<a\b/gi).length;
  const wordCount = clean(html).split(/\s+/).filter(Boolean).length;

  return {
    title,
    metaDescription,
    h1,
    headings,
    textSnippets,
    navLabels,
    ctaLabels,
    emails,
    phones,
    socialLinks,
    addressHints,
    imagesCount,
    formsCount,
    linksCount,
    wordCount,
    https: finalUrl.startsWith("https:"),
    hasViewportMeta: /<meta[^>]+name=["']viewport["']/i.test(rawHtml),
    hasSchemaOrg: lower.includes("application/ld+json") || lower.includes("schema.org"),
    hasFavicon: /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(rawHtml),
    hasPhone: phones.length > 0,
    hasEmail: emails.length > 0,
    hasMapEmbed: lower.includes("google.com/maps") || lower.includes("maps.googleapis.com") || lower.includes("openstreetmap"),
  };
}
