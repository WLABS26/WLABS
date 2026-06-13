import type { Metadata } from "next";

import { PageHeader } from "@/components/sections/page-header";
import { Solution } from "@/components/sections/solution";
import { AuditFramework } from "@/components/sections/audit-framework";
import { Offer } from "@/components/sections/offer";
import { Cta } from "@/components/sections/cta";

export const metadata: Metadata = {
  title: "Services",
  description:
    "WLABS audits your current website against a standardized 100-point framework, then designs and builds a modern MVP homepage tailored to your business.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Everything you need to replace an outdated website with a modern one."
        description="WLABS combines a standardized audit, AI-assisted design, and human quality control into one fixed-price service - so you always know what you're getting."
      />
      <Solution />
      <AuditFramework />
      <Offer />
      <Cta />
    </>
  );
}
