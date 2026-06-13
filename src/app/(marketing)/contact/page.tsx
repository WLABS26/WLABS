import type { Metadata } from "next";
import { Mail, Clock, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/sections/page-header";
import { PreviewRequestForm } from "@/components/forms/preview-request-form";
import { ContactForm } from "@/components/forms/contact-form";
import { FadeIn } from "@/components/motion/fade-in";
import { BRAND } from "@/modules/shared/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a free website preview or send WLABS a message - we typically reply within one business day.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's build your modern website."
        description="Request a free preview concept of your new homepage, or send us a message. No spam, no obligation."
      />

      <section className="section-padding pt-0">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <PreviewRequestForm />
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
          <ContactForm />

          <FadeIn delay={0.1} className="flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-8">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-cyan">
                <Mail className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">Prefer email?</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                You can also reach us directly and we&apos;ll get back to you within one business day.
              </p>
              <a
                href={`mailto:${BRAND.contactEmail}`}
                className="mt-3 inline-block text-sm font-semibold text-brand-cyan hover:underline"
              >
                {BRAND.contactEmail}
              </a>
            </div>

            <div className="glass-card rounded-2xl p-8">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-cyan">
                <Clock className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">What happens next?</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                We&apos;ll review your request, run a quick audit of your current site, and send a preview
                concept link - with no obligation to proceed.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-cyan">
                <ShieldCheck className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">No spam, ever</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                We only use your details to prepare your preview and a one-time follow-up. You can opt
                out at any time.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
