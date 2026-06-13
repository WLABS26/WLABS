import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/sections/section-heading";
import { PROCESS_STEPS } from "@/modules/shared/constants";

export function Process() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Process"
          title="From outdated to optimized in four steps."
          description="The same standardized process runs for every project - fast, repeatable, and quality-controlled."
        />

        <div className="relative mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block" />
          {PROCESS_STEPS.map((step, i) => (
            <FadeIn key={step.step} delay={i * 0.1}>
              <div className="glass-card glass-card-hover relative h-full rounded-2xl p-7">
                <span className="text-gradient text-4xl font-bold">{step.step}</span>
                <h3 className="mt-4 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
