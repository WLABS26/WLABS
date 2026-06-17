import { Search, LayoutTemplate, Rocket, type LucideIcon } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/sections/section-heading";

const ICON_MAP: Record<string, LucideIcon> = {
  search: Search,
  "layout-template": LayoutTemplate,
  rocket: Rocket,
};

interface SolutionCard {
  icon: string;
  title: string;
  description: string;
}

interface SolutionDict {
  eyebrow: string;
  title: string;
  cards: SolutionCard[];
}

export function Solution({ dict }: { dict: SolutionDict }) {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={dict.eyebrow} title={dict.title} />

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {dict.cards.map((card, i) => {
            const Icon = ICON_MAP[card.icon] ?? Rocket;
            return (
              <FadeIn key={card.title} delay={i * 0.1}>
                <div className="glass-card glass-card-hover relative h-full overflow-hidden rounded-2xl p-8">
                  <div className="absolute -right-10 -top-10 size-32 rounded-full bg-gradient-brand opacity-20 blur-2xl" />
                  <span className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-lg shadow-brand-blue/30">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="text-xl font-bold text-white">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{card.description}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
