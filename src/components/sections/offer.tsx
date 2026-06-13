import { CheckCircle2 } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/sections/section-heading";
import { OFFER_ITEMS } from "@/modules/shared/constants";

export function Offer() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="What You Get"
          title="A modern business website without agency complexity."
          description="No lengthy discovery calls, no bloated scopes. Just the essentials, executed well."
        />

        <FadeIn delay={0.1} className="mx-auto mt-14 max-w-4xl">
          <div className="glass-card rounded-2xl p-8 sm:p-10">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {OFFER_ITEMS.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 shrink-0 text-brand-cyan" />
                  <span className="text-sm font-medium text-white sm:text-base">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
