import type { Metadata } from "next";

import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { Solution } from "@/components/sections/solution";
import { Process } from "@/components/sections/process";
import { Offer } from "@/components/sections/offer";
import { Pricing } from "@/components/sections/pricing";
import { Examples } from "@/components/sections/examples";
import { Trust } from "@/components/sections/trust";
import { Cta } from "@/components/sections/cta";
import { Faq } from "@/components/sections/faq";

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return {
    title: { absolute: dict.pages.home.metaTitle },
    description: dict.pages.home.metaDescription,
    alternates: {
      languages: { en: "/en", de: "/de" },
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const contactHref = `/${locale}/contact`;
  const processHref = `/${locale}/process`;

  return (
    <>
      <Hero dict={dict.hero} contactHref={contactHref} processHref={processHref} />
      <Problem dict={dict.problem} />
      <Solution dict={dict.solution} />
      <Process dict={dict.process} />
      <Offer dict={dict.offer} />
      <Pricing dict={dict.pricing} contactHref={contactHref} checkoutHref={`/${locale}/checkout`} />
      <Examples dict={dict.examples} />
      <Trust dict={dict.trust} />
      <Cta dict={dict.cta} contactHref={contactHref} />
      <Faq dict={dict.faq} />
    </>
  );
}
