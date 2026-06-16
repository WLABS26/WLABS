import type { Metadata } from "next";

import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/sections/page-header";
import { Process } from "@/components/sections/process";
import { Trust } from "@/components/sections/trust";
import { Cta } from "@/components/sections/cta";

interface ProcessPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: ProcessPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.pages.process.metaTitle,
    description: dict.pages.process.metaDescription,
    alternates: { languages: { en: "/en/process", de: "/de/process" } },
  };
}

export default async function ProcessPage({ params }: ProcessPageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const p = dict.pages.process;

  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} description={p.description} />
      <Process dict={dict.process} />
      <Trust dict={dict.trust} />
      <Cta dict={dict.cta} contactHref={`/${locale}/contact`} />
    </>
  );
}
