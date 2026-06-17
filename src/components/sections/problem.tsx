import { AlertTriangle, Smartphone, PhoneMissed, MessageCircleQuestion, ShieldAlert, Gauge } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/sections/section-heading";

const ICONS = [AlertTriangle, Smartphone, PhoneMissed, MessageCircleQuestion, ShieldAlert, Gauge];

interface ProblemDict {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
}

export function Problem({ dict }: { dict: ProblemDict }) {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dict.points.map((point, i) => {
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
