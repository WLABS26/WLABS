import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

import { hasLocale, type Locale } from "@/lib/i18n";
import { formatEur } from "@/lib/utils";
import { FadeIn } from "@/components/motion/fade-in";
import { PRICING } from "@/modules/shared/constants";
import { CheckoutForm } from "./checkout-form";

interface CheckoutPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { lang } = await params;
  const de = lang === "de";
  return {
    title: de ? `Jetzt bestellen — ${formatEur(PRICING.mvp.price)} | WLABS` : `Get started — ${formatEur(PRICING.mvp.price)} | WLABS`,
    description: de
      ? "Bestellen Sie Ihr Website MVP direkt — wir erstellen Ihr modernes Websitekonzept innerhalb von 48 Stunden."
      : "Order your Website MVP directly — we deliver your modern website concept within 48 hours.",
    alternates: { languages: { en: "/en/checkout", de: "/de/checkout" } },
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  const locale = lang as Locale;
  const de = locale === "de";

  return (
    <section className="section-padding">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: what's included */}
          <FadeIn>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-brand-cyan">
                  {de ? "Website MVP" : "Website MVP"}
                </p>
                <h1 className="mt-2 text-4xl font-bold text-white">
                  {de ? "Ihre neue Website in 48 Stunden." : "Your new website in 48 hours."}
                </h1>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gradient">{formatEur(PRICING.mvp.price)}</span>
                  <span className="text-sm text-muted">{de ? "einmalig" : "one-time"}</span>
                </div>
              </div>

              <ul className="space-y-3">
                {PRICING.mvp.includes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-cyan" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted">
                {de
                  ? "Nach dem Kauf erstellen wir Ihr individuelles Website-Konzept und melden uns innerhalb von 24 Stunden."
                  : "After purchase we build your bespoke website concept and get back to you within 24 hours."}
              </div>
            </div>
          </FadeIn>

          {/* Right: form */}
          <FadeIn delay={0.1}>
            <div className="glass-card rounded-3xl p-8">
              <h2 className="mb-6 text-xl font-semibold text-white">
                {de ? "Ihre Angaben" : "Your details"}
              </h2>
              <CheckoutForm lang={locale} />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
