/**
 * Normalize a website URL for consistent deduplication and suppression
 * matching, e.g. "https://www.Example.com/" and "example.com" both
 * normalize to "example.com".
 */
export function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.replace(/\/$/, "");
    return `${host}${path}`;
  } catch {
    return trimmed.toLowerCase().replace(/^https?:\/\//i, "").replace(/^www\./, "").replace(/\/$/, "");
  }
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}
