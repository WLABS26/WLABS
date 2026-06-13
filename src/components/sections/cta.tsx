import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";

export function Cta() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-brand-animated p-10 text-center shadow-2xl shadow-brand-blue/20 sm:p-16">
            <div className="absolute inset-0 bg-brand-navy/40" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Want to see what your website could look like?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
                Get a free, no-obligation preview concept of your modern MVP homepage - tailored to
                your business.
              </p>
              <div className="mt-10 flex justify-center">
                <Button asChild size="lg" className="!bg-white !text-brand-navy shadow-xl hover:!bg-white/90">
                  <Link href="/contact">
                    Request my preview
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
