import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/sections/section-heading";
import { PRICING } from "@/modules/shared/constants";
import { formatEur } from "@/lib/utils";

interface PricingDict {
  eyebrow: string;
  title: string;
  description: string;
  mvpBadge: string;
  mvpDescription: string;
  mvpOneTime: string;
  mvpCta: string;
  carePlanBadge: string;
  carePlanDescription: string;
  carePlanPer: string;
  carePlanCta: string;
  mvpIncludes: string[];
  carePlanIncludes: string[];
}

export function Pricing({
  dict,
  contactHref = "contact",
  checkoutHref,
}: {
  dict: PricingDict;
  contactHref?: string;
  checkoutHref?: string;
}) {
  return (
    <section id="pricing" className="section-padding">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />

        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
          {/* MVP package */}
          <FadeIn>
            <div className="border-gradient glow-blue relative flex h-full flex-col rounded-3xl p-8 sm:p-10">
              <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-white">
                <Sparkles className="size-3.5" />
                {dict.mvpBadge}
              </span>
              <h3 className="text-2xl font-bold text-white">{PRICING.mvp.name}</h3>
              <p className="mt-2 text-sm text-muted">{dict.mvpDescription}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-bold text-gradient">{formatEur(PRICING.mvp.price)}</span>
                <span className="text-sm text-muted">{dict.mvpOneTime}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {dict.mvpIncludes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-cyan" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-10 w-full">
                <Link href={checkoutHref ?? contactHref}>
                  {dict.mvpCta}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>

          {/* Care plan */}
          <FadeIn delay={0.1}>
            <div className="glass-card flex h-full flex-col rounded-3xl p-8 sm:p-10">
              <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted">
                {dict.carePlanBadge}
              </span>
              <h3 className="text-2xl font-bold text-white">{PRICING.carePlan.name}</h3>
              <p className="mt-2 text-sm text-muted">{dict.carePlanDescription}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">{formatEur(PRICING.carePlan.price)}</span>
                <span className="text-sm text-muted">/ {dict.carePlanPer}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {dict.carePlanIncludes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-cyan" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" size="lg" className="mt-10 w-full">
                <Link href={contactHref}>{dict.carePlanCta}</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
