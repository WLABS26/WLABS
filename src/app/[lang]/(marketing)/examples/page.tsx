import type { Metadata } from "next";

import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/sections/page-header";
import { Examples } from "@/components/sections/examples";
import { Cta } from "@/components/sections/cta";

interface ExamplesPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: ExamplesPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.pages.examples.metaTitle,
    description: dict.pages.examples.metaDescription,
    alternates: { languages: { en: "/en/examples", de: "/de/examples" } },
  };
}

export default async function ExamplesPage({ params }: ExamplesPageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const p = dict.pages.examples;

  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} description={p.description} />
      <Examples dict={dict.examples} />
      <Cta dict={dict.cta} contactHref={`/${locale}/contact`} />
    </>
  );
}
