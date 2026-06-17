import type { Metadata } from "next";

import { PageHeader } from "@/components/sections/page-header";
import { LegalContent } from "@/components/sections/legal-content";
import { BRAND, PRICING } from "@/modules/shared/constants";
import { formatEur } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use WLABS services.",
};

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of Service" description="Last updated: 13 June 2026" />
      <LegalContent>
        <div>
          <h2>1. Overview</h2>
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your use of the {BRAND.name} website and the
            services described on it, including the {PRICING.mvp.name} package and the optional{" "}
            {PRICING.carePlan.name}. By submitting a form or engaging {BRAND.name} for a project, you agree
            to these Terms.
          </p>
        </div>

        <div>
          <h2>2. Services</h2>
          <p>
            {BRAND.name} provides a standardized website audit, a redesigned MVP homepage concept, and
            (upon approval) a built, launch-ready website, for a fixed price of {formatEur(PRICING.mvp.price)}
            {" "}per project. The {PRICING.mvp.name} package is scoped as a single, modern, mobile-first
            homepage with the items listed on our Pricing page. Additional pages, custom features, or
            ongoing changes beyond the agreed scope may be quoted separately.
          </p>
        </div>

        <div>
          <h2>3. Preview &amp; approval</h2>
          <p>
            Before any website is finalized or launched, we provide a private preview for your review. We
            will not publish, transfer, or charge for the final website until you have reviewed and
            approved the preview.
          </p>
        </div>

        <div>
          <h2>4. Payment</h2>
          <p>
            Pricing is fixed and communicated before any work begins. Payment terms (timing and method)
            will be confirmed with you directly as part of the project setup. The optional{" "}
            {PRICING.carePlan.name} ({formatEur(PRICING.carePlan.price)} / {PRICING.carePlan.period}) is
            billed on a recurring basis and can be cancelled at any time.
          </p>
        </div>

        <div>
          <h2>5. Ownership</h2>
          <p>
            Once a project is paid for and launched, you own the resulting website and its content. We may
            request permission to reference the project (e.g. as an example), which you are free to
            decline.
          </p>
        </div>

        <div>
          <h2>6. Content you provide</h2>
          <p>
            You are responsible for ensuring that any text, images, logos, or other materials you provide
            do not infringe on third-party rights. We may draft placeholder copy based on your existing
            website, which you can review and request changes to before launch.
          </p>
        </div>

        <div>
          <h2>7. Liability</h2>
          <p>
            Our services are provided on an &quot;as is&quot; basis. To the maximum extent permitted by
            law, {BRAND.name} is not liable for indirect, incidental, or consequential damages arising from
            the use of our services or website.
          </p>
        </div>

        <div>
          <h2>8. Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of our services after changes are
            posted constitutes acceptance of the updated Terms.
          </p>
        </div>

        <div>
          <h2>9. Contact</h2>
          <p>
            Questions about these Terms can be sent to{" "}
            <a href={`mailto:${BRAND.contactEmail}`} className="text-brand-cyan hover:underline">
              {BRAND.contactEmail}
            </a>
            .
          </p>
        </div>
      </LegalContent>
    </>
  );
}
