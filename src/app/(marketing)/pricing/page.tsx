import type { Metadata } from "next";

import { PageHeader } from "@/components/sections/page-header";
import { Pricing } from "@/components/sections/pricing";
import { Offer } from "@/components/sections/offer";
import { Faq } from "@/components/sections/faq";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, fixed pricing for a launch-ready MVP website: €999 one-time, with an optional €99/month care plan for hosting and maintenance.",
};

export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="One simple price. No hidden fees."
        description="A transparent, fixed price for a launch-ready MVP homepage - plus an optional care plan to keep it running smoothly afterwards."
      />
      <Pricing />
      <Offer />
      <Faq />
    </>
  );
}
