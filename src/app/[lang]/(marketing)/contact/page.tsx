import type { Metadata } from "next";
import { Mail, Clock, ShieldCheck } from "lucide-react";

import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { BRAND } from "@/modules/shared/constants";
import { PageHeader } from "@/components/sections/page-header";
import { PreviewRequestForm } from "@/components/forms/preview-request-form";
import { ContactForm } from "@/components/forms/contact-form";
import { FadeIn } from "@/components/motion/fade-in";

interface ContactPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.pages.contact.metaTitle,
    description: dict.pages.contact.metaDescription,
    alternates: { languages: { en: "/en/contact", de: "/de/contact" } },
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const p = dict.pages.contact;

  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} description={p.description} />

      <section className="section-padding pt-0">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <PreviewRequestForm />
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
          <ContactForm />

          <FadeIn delay={0.1} className="flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-8">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-cyan">
                <Mail className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">{p.emailCardTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.emailCardDescription}</p>
              <a
                href={`mailto:${BRAND.contactEmail}`}
                className="mt-3 inline-block text-sm font-semibold text-brand-cyan hover:underline"
              >
                {BRAND.contactEmail}
              </a>
            </div>

            <div className="glass-card rounded-2xl p-8">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-cyan">
                <Clock className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">{p.nextStepsTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.nextStepsDescription}</p>
            </div>

            <div className="glass-card rounded-2xl p-8">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-cyan">
                <ShieldCheck className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">{p.noSpamTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.noSpamDescription}</p>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
