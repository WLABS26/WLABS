import type { Metadata } from "next";

import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/sections/page-header";
import { Solution } from "@/components/sections/solution";
import { AuditFramework } from "@/components/sections/audit-framework";
import { Offer } from "@/components/sections/offer";
import { Cta } from "@/components/sections/cta";

interface ServicesPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: ServicesPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.pages.services.metaTitle,
    description: dict.pages.services.metaDescription,
    alternates: { languages: { en: "/en/services", de: "/de/services" } },
  };
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const p = dict.pages.services;

  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} description={p.description} />
      <Solution dict={dict.solution} />
      <AuditFramework dict={dict.audit} />
      <Offer dict={dict.offer} />
      <Cta dict={dict.cta} contactHref={`/${locale}/contact`} />
    </>
  );
}
