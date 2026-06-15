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
  /** Site still contains unedited template/placeholder copy or phone numbers. */
  hasPlaceholderContent: boolean;
  /** Name of the responsible person/owner found on this page (Geschäftsführer, Inhaber, Vertreten durch, etc.), if any. */
  contactPerson: string | null;
  /** Absolute URL of a separate Impressum/legal-notice page linked from this page, if found. */
  imprintUrl: string | null;
  /** Absolute URL of the site's favicon/touch icon, if found. */
  faviconUrl: string | null;
  /** Value of <meta name="theme-color">, if present. */
  themeColor: string | null;
  /** A small set of representative hex brand colors found in <style> blocks. */
  brandColors: string[];
  /** Primary non-generic font family found in <style> blocks, if any. */
  fontFamily: string | null;
}

const SOCIAL_DOMAINS = ["facebook.com", "instagram.com", "twitter.com", "x.com", "linkedin.com", "youtube.com", "tiktok.com"];
const CTA_KEYWORDS = [
  "contact", "book", "call", "quote", "get started", "request", "appointment", "enquire", "inquire",
  "order", "buy", "subscribe", "sign up", "schedule", "reserve", "free", "demo",
];

/** Unedited template copy or placeholder contact details left in by mistake. */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /lorem ipsum/i,
  /welcome to (my|our|this|the) (new )?(website|site|blog)/i,
  /coming soon/i,
  /(site|page) (is currently )?under construction/i,
  /(sample|placeholder|dummy)\s+(text|content|image)/i,
  /your (company|business) name( here)?/i,
  /insert (your )?(text|content|tagline|description) here/i,
  /\b(123[\s.-]?456[\s.-]?7890|555[\s.-]?555[\s.-]?5555|000[\s.-]?000[\s.-]?0000|123[\s.-]?123[\s.-]?1234)\b/,
];

/** Generic CSS font-family keywords/stacks that don't represent a specific brand font. */
const GENERIC_FONT_FAMILIES = new Set([
  "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui",
  "-apple-system", "blinkmacsystemfont", "ui-sans-serif", "ui-serif",
  "ui-monospace", "ui-rounded", "inherit", "initial", "unset", "emoji",
]);

/** Link text/href patterns for an Impressum / legal-notice page (DACH + generic English/French/Italian). */
const IMPRINT_LINK_PATTERNS: RegExp[] = [
  /impressum/i,
  /imprint/i,
  /legal\s*notice/i,
  /mentions?\s*l[ée]gales?/i,
  /note\s*legali/i,
];

/** A capitalized name, e.g. "Jürgen Müller-Schmidt" - up to 4 words, allows German umlauts/ß. */
const NAME_PATTERN = "[A-ZÄÖÜ][\\wäöüß.'-]*(?:\\s+[A-ZÄÖÜ][\\wäöüß.'-]*){0,3}";

/**
 * "Responsible person" labels commonly found on Impressum/legal-notice pages
 * (DACH + generic English). Anchored to the start of a line and capture the
 * remainder, since the actual name follows on the same line as the label but
 * the next line often starts with another uppercase-led label (e.g.
 * "E-Mail: ...") that a flattened-text match could otherwise spill into.
 */
const CONTACT_PERSON_LINE_PATTERNS: RegExp[] = [
  /^(?:Geschäftsführer(?:in)?|Geschaeftsfuehrer(?:in)?|Inhaber(?:in)?|Vertreten durch|Vertretungsberechtigte[rn]?)\s*[:\-]?\s*(.+)$/i,
  // Allows the common "...nach § 55 Abs. 2 RStV:" clause between the label and the name.
  /^Verantwortlich(?:er)? für den Inhalt[^:]{0,40}[:\-]?\s*(.+)$/i,
  /^Responsible for (?:this )?content[^:]{0,40}[:\-]?\s*(.+)$/i,
  /^(?:Owner|Managing Director|Represented by|CEO)\s*[:\-]?\s*(.+)$/i,
];

/** Matches a name at the start of a string, e.g. "Max Mustermann" in "Max Mustermann, Tel: ...". */
const NAME_AT_START = new RegExp(`^${NAME_PATTERN}`);

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

/**
 * Split HTML into cleaned, non-empty lines of text, breaking on block-level
 * boundaries (paragraphs, list items, table cells/rows, headings, <br>).
 * Used where line boundaries matter - e.g. an Impressum label like
 * "Geschäftsführer: Max Mustermann" must not run on into the next line's
 * "E-Mail: ..." the way a fully-flattened single-string match would.
 */
function splitIntoLines(rawHtml: string): string[] {
  return stripNonContent(rawHtml)
    .replace(/<(br|\/p|\/div|\/li|\/td|\/tr|\/h[1-6])\b[^>]*>/gi, "\n")
    .split("\n")
    .map((line) => clean(line))
    .filter(Boolean);
}

/**
 * Find a link to the site's Impressum/legal-notice page, if any. Checks both
 * the link text and href/slug, since some sites label the link with an icon
 * or a translated phrase but keep "impressum" in the URL. Same-page anchors
 * (e.g. `#impressum`) are ignored - that content is already captured by the
 * homepage scan. Returns an absolute URL, or null if none is found.
 */
export function findImprintUrl(rawHtml: string, baseUrl: string): string | null {
  const matchesPattern = (value: string) => IMPRINT_LINK_PATTERNS.some((re) => re.test(value));

  for (const anchor of matchAll(rawHtml, /<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const hrefMatch = anchor[1].match(/href=["']([^"']*)["']/i);
    if (!hrefMatch) continue;

    const href = decodeEntities(hrefMatch[1]).trim();
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) continue;

    const text = clean(anchor[2]);
    if (!matchesPattern(text) && !matchesPattern(href)) continue;

    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.href.split("#")[0] === baseUrl.split("#")[0]) continue;
      return resolved.href;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Try to pull a name out of a line that starts with a "responsible person"
 * label, e.g. "Geschäftsführer: Max Mustermann". Recurses once on the
 * remainder so chained labels (e.g. "Vertretungsberechtigter
 * Geschäftsführer: Max Mustermann") resolve to the name rather than the
 * inner label.
 */
function extractNameFromLabelledLine(line: string, depth = 0): string | null {
  if (depth > 2) return null;

  for (const pattern of CONTACT_PERSON_LINE_PATTERNS) {
    const rest = line.match(pattern)?.[1]?.trim();
    if (!rest) continue;

    const nested = extractNameFromLabelledLine(rest, depth + 1);
    if (nested) return nested;

    const name = rest.split(/[,|]/)[0]?.trim().match(NAME_AT_START)?.[0];
    if (name && name.length >= 3 && name.length <= 60 && !/\d/.test(name)) {
      return name;
    }
  }

  return null;
}

/** Extract the "responsible person" name from an Impressum/legal-notice page (Geschäftsführer, Inhaber, Vertreten durch, etc.). */
export function extractContactPerson(rawHtml: string): string | null {
  for (const line of splitIntoLines(rawHtml)) {
    const name = extractNameFromLabelledLine(line);
    if (name) return name;
  }

  return null;
}

/**
 * Merge contact details found on a separate Impressum/legal-notice page into
 * the homepage's extracted data. Impressum-page emails/phones/contact person
 * take priority over the homepage's - in DACH countries the Impressum is the
 * legally-authoritative source for contact details.
 */
export function mergeImprintData(homepage: ExtractedWebsiteData, imprint: ExtractedWebsiteData, imprintUrl: string): ExtractedWebsiteData {
  return {
    ...homepage,
    emails: unique([...imprint.emails, ...homepage.emails]).slice(0, 10),
    phones: unique([...imprint.phones, ...homepage.phones]).slice(0, 8),
    addressHints: unique([...imprint.addressHints, ...homepage.addressHints]).slice(0, 5),
    hasEmail: homepage.hasEmail || imprint.hasEmail,
    hasPhone: homepage.hasPhone || imprint.hasPhone,
    contactPerson: imprint.contactPerson ?? homepage.contactPerson,
    imprintUrl,
  };
}

/** True if a hex color is effectively grayscale (white, black, or near-neutral gray). */
function isGrayscaleHex(hex: string): boolean {
  const value = hex.replace("#", "");
  const expanded = value.length === 3 ? value.split("").map((c) => c + c).join("") : value.slice(0, 6);
  if (expanded.length !== 6 || /[^0-9a-fA-F]/.test(expanded)) return true;

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  return Math.max(r, g, b) - Math.min(r, g, b) < 16;
}

/** Extract an absolute favicon/touch-icon URL from a <link rel="...icon..."> tag, if any. */
function extractFaviconUrl(rawHtml: string, baseUrl: string): string | null {
  for (const tag of matchAll(rawHtml, /<link\b([^>]*)>/gi)) {
    const attrs = tag[1];
    if (!/rel=["'][^"']*icon[^"']*["']/i.test(attrs)) continue;

    const hrefMatch = attrs.match(/href=["']([^"']*)["']/i);
    const href = hrefMatch ? decodeEntities(hrefMatch[1]).trim() : "";
    if (!href) continue;

    try {
      return new URL(href, baseUrl).href;
    } catch {
      continue;
    }
  }

  return null;
}

/** Extract <meta name="theme-color" content="..."> if present. */
function extractThemeColor(rawHtml: string): string | null {
  const match =
    rawHtml.match(/<meta[^>]+name=["']theme-color["'][^>]*content=["']([^"']*)["']/i) ??
    rawHtml.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']theme-color["']/i);
  return match ? decodeEntities(match[1]).trim() || null : null;
}

/**
 * Extract a small set of representative brand colors from <style> blocks.
 * Prefers hex values assigned to "brand"/"primary"/"accent"/"theme" CSS
 * custom properties; falls back to the most frequent non-grayscale hex
 * colors used anywhere in the stylesheet.
 */
function extractBrandColors(rawHtml: string): string[] {
  const styleBlocks = matchAll(rawHtml, /<style\b[^>]*>([\s\S]*?)<\/style>/gi)
    .map((m) => m[1])
    .join("\n");
  if (!styleBlocks) return [];

  const namedVars = unique(
    matchAll(styleBlocks, /--[\w-]*(?:brand|primary|accent|theme)[\w-]*\s*:\s*(#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)/gi)
      .map((m) => m[1].toLowerCase())
      .filter((hex) => !isGrayscaleHex(hex)),
  );
  if (namedVars.length > 0) return namedVars.slice(0, 3);

  const counts = new Map<string, number>();
  for (const m of matchAll(styleBlocks, /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/g)) {
    const hex = m[0].toLowerCase();
    if (isGrayscaleHex(hex)) continue;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hex]) => hex);
}

/**
 * Extract the primary brand font family from <style> blocks, skipping
 * generic CSS font keywords/stacks (sans-serif, system-ui, etc.).
 */
function extractFontFamily(rawHtml: string): string | null {
  const styleBlocks = matchAll(rawHtml, /<style\b[^>]*>([\s\S]*?)<\/style>/gi)
    .map((m) => m[1])
    .join("\n");
  if (!styleBlocks) return null;

  for (const m of matchAll(styleBlocks, /font-family\s*:\s*([^;}{]+)/gi)) {
    const firstFont = m[1].split(",")[0]?.trim().replace(/^["']|["']$/g, "");
    if (firstFont && !GENERIC_FONT_FAMILIES.has(firstFont.toLowerCase())) {
      return firstFont;
    }
  }

  return null;
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

  const contactPerson = extractContactPerson(rawHtml);
  const imprintUrl = findImprintUrl(rawHtml, finalUrl);
  const faviconUrl = extractFaviconUrl(rawHtml, finalUrl);
  const themeColor = extractThemeColor(rawHtml);
  const brandColors = extractBrandColors(rawHtml);
  const fontFamily = extractFontFamily(rawHtml);

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
    hasPlaceholderContent: PLACEHOLDER_PATTERNS.some((re) => re.test(rawHtml)),
    contactPerson,
    imprintUrl,
    faviconUrl,
    themeColor,
    brandColors,
    fontFamily,
  };
}
