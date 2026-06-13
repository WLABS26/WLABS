import type { Metadata } from "next";

import { PageHeader } from "@/components/sections/page-header";
import { Examples } from "@/components/sections/examples";
import { Cta } from "@/components/sections/cta";

export const metadata: Metadata = {
  title: "Examples",
  description:
    "Explore how WLABS adapts modern, conversion-focused homepage designs to different local business industries.",
};

export default function ExamplesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Examples"
        title="See what's possible for your industry."
        description="WLABS uses configurable industry templates - tone, layout, and calls to action adapted to what actually works for each type of business."
      />
      <Examples />
      <Cta />
    </>
  );
}
