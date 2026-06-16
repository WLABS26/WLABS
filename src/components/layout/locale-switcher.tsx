"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { LOCALES, type Locale } from "@/lib/i18n-config";

interface LocaleSwitcherProps {
  currentLocale: Locale;
  labels: Record<string, string>;
}

export function LocaleSwitcher({ currentLocale, labels }: LocaleSwitcherProps) {
  const pathname = usePathname();

  function localeHref(locale: Locale): string {
    // Replace the leading /en or /de with the new locale.
    // pathname is like /en/contact or /en (no trailing slash after root).
    const withoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");
    const cleaned = withoutLocale === "/" ? "" : withoutLocale;
    return `/${locale}${cleaned}`;
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-1 py-0.5">
      {LOCALES.map((locale) => (
        <Link
          key={locale}
          href={localeHref(locale)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
            locale === currentLocale ? "bg-brand-cyan text-brand-navy" : "text-muted hover:text-white",
          )}
          aria-label={labels[locale] ?? locale.toUpperCase()}
        >
          {labels[locale] ?? locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
