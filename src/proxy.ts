import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const LOCALES = ["en", "de"] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = "en";

const MARKETING_SEGMENTS = new Set([
  "services",
  "process",
  "examples",
  "pricing",
  "faq",
  "contact",
  "legal",
]);

function getPreferredLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  for (const part of acceptLanguage.split(",")) {
    const tag = part.trim().split(";")[0].trim().toLowerCase();
    if (tag.startsWith("de")) return "de";
    if (tag.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}

function isMarketingPath(pathname: string): boolean {
  if (pathname === "/") return true;
  const first = pathname.split("/")[1] ?? "";
  return MARKETING_SEGMENTS.has(first);
}

function hasLocalePrefix(pathname: string): boolean {
  const first = pathname.split("/")[1] ?? "";
  return (LOCALES as readonly string[]).includes(first);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Admin auth ---
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = verifySessionToken(token);
    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // --- Locale routing for marketing pages ---
  if (isMarketingPath(pathname) && !hasLocalePrefix(pathname)) {
    const locale = getPreferredLocale(request);
    const localePrefix = `/${locale}`;
    const target = pathname === "/" ? localePrefix : `${localePrefix}${pathname}`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/",
    "/services/:path*",
    "/process/:path*",
    "/examples/:path*",
    "/pricing/:path*",
    "/faq/:path*",
    "/contact/:path*",
    "/legal/:path*",
  ],
};
