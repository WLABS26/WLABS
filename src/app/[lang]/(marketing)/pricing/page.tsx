import type { Metadata } from "next";

import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/sections/page-header";
import { Pricing } from "@/components/sections/pricing";
import { Offer } from "@/components/sections/offer";
import { Faq } from "@/components/sections/faq";

interface PricingPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PricingPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.pages.pricing.metaTitle,
    description: dict.pages.pricing.metaDescription,
    alternates: { languages: { en: "/en/pricing", de: "/de/pricing" } },
  };
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const p = dict.pages.pricing;

  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} description={p.description} />
      <Pricing dict={dict.pricing} contactHref={`/${locale}/contact`} checkoutHref={`/${locale}/checkout`} />
      <Offer dict={dict.offer} />
      <Faq dict={dict.faq} />
    </>
  );
}
