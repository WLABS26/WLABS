import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/sections/section-heading";
import { INDUSTRY_ICONS } from "@/components/visuals/industry-icons";
import { Badge } from "@/components/ui/badge";

interface ExampleIndustry {
  value: string;
  label: string;
  description: string;
}

interface ExamplesDict {
  eyebrow: string;
  title: string;
  description: string;
  previewBadge: string;
  industries: ExampleIndustry[];
}

export function Examples({ dict }: { dict: ExamplesDict }) {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dict.industries.map((example, i) => {
            const Icon = INDUSTRY_ICONS[example.value as keyof typeof INDUSTRY_ICONS] ?? INDUSTRY_ICONS.other;
            return (
              <FadeIn key={example.value} delay={(i % 3) * 0.08}>
                <div className="glass-card glass-card-hover group h-full overflow-hidden rounded-2xl">
                  <div className="relative flex h-28 items-center justify-center bg-gradient-brand-animated">
                    <div className="absolute inset-0 bg-brand-navy/30" />
                    <span className="relative flex size-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                      <Icon className="size-7 text-white" />
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-white">{example.label}</h3>
                      <Badge variant="brand">{dict.previewBadge}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{example.description}</p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
