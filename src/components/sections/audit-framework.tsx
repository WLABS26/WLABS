import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/sections/section-heading";
import { ScoreGauge } from "@/components/visuals/score-gauge";
import { AUDIT_CATEGORIES, AUDIT_TOTAL_POINTS } from "@/modules/shared/types";

interface AuditDict {
  eyebrow: string;
  title: string;
  description: string;
  scoredOut: string;
}

export function AuditFramework({ dict }: { dict: AuditDict }) {
  const scoredOutText = dict.scoredOut.replace("{total}", String(AUDIT_TOTAL_POINTS));

  return (
    <section className="section-padding">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-[16rem_1fr]">
          <FadeIn className="flex justify-center lg:justify-start">
            <div className="glass-card flex h-fit flex-col items-center gap-4 rounded-2xl p-8 lg:sticky lg:top-28">
              <ScoreGauge score={AUDIT_TOTAL_POINTS} size={120} label="Total points" />
              <p className="max-w-[12rem] text-center text-sm leading-relaxed text-muted">{scoredOutText}</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {AUDIT_CATEGORIES.map((category, i) => (
              <FadeIn key={category.key} delay={i * 0.05}>
                <div className="glass-card glass-card-hover h-full rounded-2xl p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-white">{category.label}</h3>
                    <span className="shrink-0 rounded-full bg-brand-blue/15 px-3 py-1 text-xs font-semibold text-brand-cyan">
                      {category.maxPoints} pts
                    </span>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {category.criteria.map((criterion) => (
                      <li key={criterion} className="flex items-start gap-2 text-sm text-muted">
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-brand-cyan" />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
