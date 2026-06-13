import type { Metadata } from "next";

import { PageHeader } from "@/components/sections/page-header";
import { Faq } from "@/components/sections/faq";
import { Cta } from "@/components/sections/cta";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about WLABS pricing, process, timelines, and what's included.",
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="FAQ"
        title="Got questions? We've got answers."
        description="Everything you need to know before requesting your free website preview."
      />
      <Faq />
      <Cta />
    </>
  );
}
