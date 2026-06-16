import type { Metadata } from "next";

import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/sections/page-header";
import { Faq } from "@/components/sections/faq";
import { Cta } from "@/components/sections/cta";

interface FaqPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: FaqPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.pages.faq.metaTitle,
    description: dict.pages.faq.metaDescription,
    alternates: { languages: { en: "/en/faq", de: "/de/faq" } },
  };
}

export default async function FaqPage({ params }: FaqPageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const p = dict.pages.faq;

  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} description={p.description} />
      <Faq dict={dict.faq} />
      <Cta dict={dict.cta} contactHref={`/${locale}/contact`} />
    </>
  );
}
