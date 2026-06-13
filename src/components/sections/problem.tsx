import { AlertTriangle, Smartphone, PhoneMissed, MessageCircleQuestion, ShieldAlert, Gauge } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/sections/section-heading";
import { PROBLEM_POINTS } from "@/modules/shared/constants";

const ICONS = [AlertTriangle, Smartphone, PhoneMissed, MessageCircleQuestion, ShieldAlert, Gauge];

export function Problem() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Problem"
          title="Your website might be costing you customers before they ever call."
          description="Most small-business websites were built years ago and never updated. Visitors notice - and they leave."
        />

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEM_POINTS.map((point, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <FadeIn key={point} delay={i * 0.06}>
                <div className="glass-card glass-card-hover flex items-start gap-4 rounded-2xl p-6">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                    <Icon className="size-5" />
                  </span>
                  <p className="text-sm font-medium leading-relaxed text-white sm:text-base">{point}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
