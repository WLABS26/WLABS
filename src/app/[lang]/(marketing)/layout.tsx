import { notFound } from "next/navigation";

import { hasLocale, getDictionary, type Locale } from "@/lib/i18n";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BackgroundFx } from "@/components/layout/background-fx";

interface MarketingLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function MarketingLayout({ children, params }: MarketingLayoutProps) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  const navLinks = [
    { label: dict.nav.services, href: `/${locale}/services` },
    { label: dict.nav.process, href: `/${locale}/process` },
    { label: dict.nav.examples, href: `/${locale}/examples` },
    { label: dict.nav.pricing, href: `/${locale}/pricing` },
    { label: dict.nav.faq, href: `/${locale}/faq` },
  ];

  return (
    <div className="relative flex min-h-screen flex-col">
      <BackgroundFx />
      <Navbar
        navLinks={navLinks}
        ctaLabel={dict.nav.cta}
        ctaHref={`/${locale}/contact`}
        locale={locale}
        localeLabels={dict.localeSwitcher}
      />
      <main className="flex-1">{children}</main>
      <Footer navLinks={navLinks} locale={locale} dict={dict.footer} />
    </div>
  );
}
