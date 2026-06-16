import Link from "next/link";
import { Briefcase, Camera, X, Mail } from "lucide-react";

import { BRAND } from "@/modules/shared/constants";
import { Logo } from "@/components/layout/logo";
import type { Locale } from "@/lib/i18n-config";

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "#", icon: Briefcase },
  { label: "Instagram", href: "#", icon: Camera },
  { label: "X / Twitter", href: "#", icon: X },
];

interface NavLink {
  label: string;
  href: string;
}

interface FooterDict {
  navigate: string;
  legal: string;
  getInTouch: string;
  privacyPolicy: string;
  imprint: string;
  terms: string;
  rights: string;
  tagline: string;
  supportingLine: string;
  positioning: string;
}

interface FooterProps {
  navLinks: NavLink[];
  locale: Locale;
  dict: FooterDict;
}

export function Footer({ navLinks, locale, dict }: FooterProps) {
  const legalLinks = [
    { label: dict.privacyPolicy, href: `/${locale}/legal/privacy` },
    { label: dict.imprint, href: `/${locale}/legal/imprint` },
    { label: dict.terms, href: `/${locale}/legal/terms` },
  ];

  return (
    <footer className="border-t border-white/10 bg-brand-navy">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo href={`/${locale}`} />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {dict.tagline} {dict.supportingLine}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted transition-colors hover:border-brand-cyan/40 hover:text-brand-cyan"
                >
                  <social.icon className="size-4" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{dict.navigate}</h3>
            <ul className="mt-4 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{dict.legal}</h3>
            <ul className="mt-4 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{dict.getInTouch}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={`mailto:${BRAND.contactEmail}`}
                  className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-white"
                >
                  <Mail className="size-4" />
                  {BRAND.contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.name} — {BRAND.fullName}. {dict.rights}
          </p>
          <p className="text-muted/70">{dict.positioning}</p>
        </div>
      </div>
    </footer>
  );
}
