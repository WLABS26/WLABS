import Link from "next/link";
import { Briefcase, Camera, X, Mail } from "lucide-react";

import { BRAND, NAV_LINKS } from "@/modules/shared/constants";
import { Logo } from "@/components/layout/logo";

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Imprint", href: "/legal/imprint" },
  { label: "Terms", href: "/legal/terms" },
];

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "#", icon: Briefcase },
  { label: "Instagram", href: "#", icon: Camera },
  { label: "X / Twitter", href: "#", icon: X },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-brand-navy">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {BRAND.tagline} {BRAND.supportingLine}
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
            <h3 className="text-sm font-semibold text-white">Navigate</h3>
            <ul className="mt-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/contact" className="text-sm text-muted transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Legal</h3>
            <ul className="mt-4 space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Get in touch</h3>
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
            © {new Date().getFullYear()} {BRAND.name} — {BRAND.fullName}. All rights reserved.
          </p>
          <p className="text-muted/70">{BRAND.positioning}</p>
        </div>
      </div>
    </footer>
  );
}
