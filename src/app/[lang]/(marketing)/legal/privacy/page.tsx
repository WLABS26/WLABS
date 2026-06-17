import type { Metadata } from "next";

import { PageHeader } from "@/components/sections/page-header";
import { LegalContent } from "@/components/sections/legal-content";
import { BRAND } from "@/modules/shared/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How WLABS collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" description="Last updated: 13 June 2026" />
      <LegalContent>
        <div>
          <h2>1. Who we are</h2>
          <p>
            {BRAND.name} ({BRAND.fullName}) (&quot;WLABS&quot;, &quot;we&quot;, &quot;us&quot;) operates this
            website and the services described on it. For any questions about this policy or your
            personal data, contact us at{" "}
            <a href={`mailto:${BRAND.contactEmail}`} className="text-brand-cyan hover:underline">
              {BRAND.contactEmail}
            </a>
            .
          </p>
        </div>

        <div>
          <h2>2. What data we collect</h2>
          <p>When you submit a form on this website (e.g. a website preview request or a contact message), we collect:</p>
          <ul>
            <li>Your name</li>
            <li>Email address and, if provided, phone number</li>
            <li>Business name and website URL, if provided</li>
            <li>Industry / business category, if provided</li>
            <li>Any message or additional information you choose to share</li>
          </ul>
          <p>We do not use cookies or analytics scripts that track you across other websites.</p>
        </div>

        <div>
          <h2>3. How we use your data</h2>
          <p>We use the information you provide to:</p>
          <ul>
            <li>Review your current website and prepare a free preview concept</li>
            <li>Respond to your enquiry and follow up about our services</li>
            <li>Maintain an internal record of leads and communications (our CRM)</li>
            <li>Comply with legal obligations where applicable</li>
          </ul>
          <p>
            Our legal basis for this processing is your consent (by submitting the form) and our
            legitimate interest in responding to enquiries about our services.
          </p>
        </div>

        <div>
          <h2>4. Outbound communication and opt-out</h2>
          <p>
            If we reach out about a preview concept or follow-up, you can opt out of further contact at
            any time by replying &quot;unsubscribe&quot; or emailing us at{" "}
            <a href={`mailto:${BRAND.contactEmail}`} className="text-brand-cyan hover:underline">
              {BRAND.contactEmail}
            </a>
            . Once you opt out, we add your email address and/or website to a suppression list and will
            not contact you again regarding our services.
          </p>
        </div>

        <div>
          <h2>5. Data retention</h2>
          <p>
            We retain personal data for as long as necessary to provide our services, respond to your
            enquiry, and meet legal or accounting obligations. You can request deletion of your data at
            any time (see Section 7).
          </p>
        </div>

        <div>
          <h2>6. Sharing your data</h2>
          <p>
            We do not sell your personal data. We may use third-party service providers (e.g. hosting,
            email delivery, database providers) strictly to operate our services. These providers process
            data on our behalf under appropriate data protection terms.
          </p>
        </div>

        <div>
          <h2>7. Your rights</h2>
          <p>
            Depending on your location, you may have the right to access, correct, export, or delete your
            personal data, and to object to or restrict certain processing. To exercise any of these
            rights, contact us at{" "}
            <a href={`mailto:${BRAND.contactEmail}`} className="text-brand-cyan hover:underline">
              {BRAND.contactEmail}
            </a>
            .
          </p>
        </div>

        <div>
          <h2>8. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date above
            reflects the most recent changes.
          </p>
        </div>
      </LegalContent>
    </>
  );
}
