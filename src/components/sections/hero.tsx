import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { BrowserMockup, MockupSkeleton } from "@/components/visuals/browser-mockup";
import { ScoreGauge } from "@/components/visuals/score-gauge";

interface HeroDict {
  badge: string;
  title1: string;
  title2: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  stat1: string;
  stat2: string;
  stat3: string;
}

export function Hero({ dict }: { dict: HeroDict }) {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
        <FadeIn>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
            <Sparkles className="size-3.5" />
            {dict.badge}
          </span>

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {dict.title1}
            <br />
            <span className="text-gradient">{dict.title2}</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{dict.description}</p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="contact">
                {dict.primaryCta}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="process">{dict.secondaryCta}</Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-blue/15 text-brand-cyan">
                <TrendingUp className="size-4" />
              </span>
              {dict.stat1}
            </div>
            <div>{dict.stat2}</div>
            <div>{dict.stat3}</div>
          </div>
        </FadeIn>

        <FadeIn delay={0.15} className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative">
            <div className="absolute -inset-10 -z-10 rounded-full bg-gradient-brand opacity-20 blur-3xl" />

            <div className="animate-float">
              <BrowserMockup tone="muted" label="oldwebsite.com" className="ml-0 max-w-sm opacity-80 lg:ml-8">
                <MockupSkeleton tone="muted" />
              </BrowserMockup>
            </div>

            <div className="relative -mt-16 ml-8 animate-float [animation-delay:-3s] sm:ml-16">
              <BrowserMockup tone="brand" label="yourbusiness.com" className="max-w-sm glow-blue">
                <MockupSkeleton tone="brand" />
              </BrowserMockup>
            </div>

            <div className="glass-card absolute -right-2 top-6 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl sm:-right-8 sm:top-10">
              <ScoreGauge score={94} size={56} />
              <div className="leading-tight">
                <p className="text-xs text-muted">Audit Score</p>
                <p className="text-sm font-semibold text-emerald-400">+52 points</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
