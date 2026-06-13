import { ShieldCheck } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/sections/section-heading";
import { TRUST_POINTS } from "@/modules/shared/constants";

export function Trust() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why WLABS"
          title="A new kind of agency, built for transparency and speed."
          description="WLABS is built on modern AI-assisted workflows with human quality control - so you get speed without sacrificing trust."
        />

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_POINTS.map((point, i) => (
            <FadeIn key={point} delay={i * 0.06}>
              <div className="glass-card glass-card-hover flex items-center gap-4 rounded-2xl p-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-cyan">
                  <ShieldCheck className="size-5" />
                </span>
                <p className="text-sm font-medium text-white sm:text-base">{point}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
