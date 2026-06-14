/**
 * SSRF protection for the website crawler.
 *
 * The crawler fetches arbitrary user-supplied URLs, so it must never be tricked
 * into reaching internal/metadata services. We only allow http(s), and we
 * reject any hostname that is - or resolves to - a loopback, private, or
 * link-local address before any request is made.
 */
import { lookup } from "node:dns/promises";
import net from "node:net";

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

/** True if an IPv4/IPv6 literal falls in a loopback, private, or reserved range. */
export function isPrivateIp(ip: string): boolean {
  const type = net.isIP(ip);

  if (type === 4) {
    const parts = ip.split(".").map((n) => Number.parseInt(n, 10));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;
    if (a === 0 || a === 127) return true; // this-host / loopback
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (incl. cloud metadata)
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }

  if (type === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized === "::") return true; // loopback / unspecified
    if (normalized.startsWith("fe80")) return true; // link-local
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local fc00::/7
    // IPv4-mapped IPv6 (::ffff:a.b.c.d) - validate the embedded v4.
    const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return false;
  }

  // Not a recognised IP literal.
  return false;
}

/**
 * Validate a URL for crawling. Throws UnsafeUrlError on any disallowed scheme,
 * malformed URL, or host that resolves to a private/loopback address.
 * Returns the parsed URL on success.
 */
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError(`Invalid URL: ${rawUrl}`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError(`Unsupported protocol: ${url.protocol}`);
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".internal")) {
    throw new UnsafeUrlError(`Blocked hostname: ${hostname}`);
  }

  // If the host is an IP literal, check it directly.
  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    throw new UnsafeUrlError(`Blocked private address: ${hostname}`);
  }

  // Otherwise resolve and check every returned address.
  if (!net.isIP(hostname)) {
    let addresses: { address: string }[];
    try {
      addresses = await lookup(hostname, { all: true });
    } catch {
      throw new UnsafeUrlError(`Could not resolve hostname: ${hostname}`);
    }
    if (addresses.length === 0) throw new UnsafeUrlError(`No DNS records for: ${hostname}`);
    for (const { address } of addresses) {
      if (isPrivateIp(address)) throw new UnsafeUrlError(`Host resolves to a private address: ${hostname}`);
    }
  }

  return url;
}
