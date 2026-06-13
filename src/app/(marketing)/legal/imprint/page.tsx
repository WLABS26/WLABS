import type { Metadata } from "next";

import { PageHeader } from "@/components/sections/page-header";
import { LegalContent } from "@/components/sections/legal-content";
import { BRAND } from "@/modules/shared/constants";

export const metadata: Metadata = {
  title: "Imprint",
  description: "Legal disclosure and provider identification for WLABS.",
};

export default function ImprintPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Imprint" description="Provider identification, per applicable EU disclosure requirements." />
      <LegalContent>
        <div>
          <h2>Service provider</h2>
          <p>
            {BRAND.name} ({BRAND.fullName})
            <br />
            [Registered company name]
            <br />
            [Registered address]
            <br />
            [Country]
          </p>
        </div>

        <div>
          <h2>Contact</h2>
          <p>
            Email:{" "}
            <a href={`mailto:${BRAND.contactEmail}`} className="text-brand-cyan hover:underline">
              {BRAND.contactEmail}
            </a>
            <br />
            Website: {BRAND.domain}
          </p>
        </div>

        <div>
          <h2>Registration details</h2>
          <p>[Company registration number] · [VAT number, if applicable]</p>
        </div>

        <div>
          <h2>Responsible for content</h2>
          <p>[Name of responsible person], {BRAND.name}</p>
        </div>

        <div>
          <h2>Dispute resolution</h2>
          <p>
            We are not obliged or willing to participate in dispute resolution proceedings before a
            consumer arbitration board, unless otherwise required by applicable law.
          </p>
        </div>

        <p className="text-xs text-muted/70">
          This page is a placeholder. Replace the bracketed fields above with the legal entity details for
          {" "}
          {BRAND.name} before this site goes live.
        </p>
      </LegalContent>
    </>
  );
}
