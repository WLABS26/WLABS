import type { Metadata } from "next";

import { PageHeader } from "@/components/sections/page-header";
import { Process } from "@/components/sections/process";
import { Trust } from "@/components/sections/trust";
import { Cta } from "@/components/sections/cta";

export const metadata: Metadata = {
  title: "Process",
  description:
    "How WLABS turns an outdated website into a modern, launch-ready MVP in 48 hours - analyze, design, build, and launch.",
};

export default function ProcessPage() {
  return (
    <>
      <PageHeader
        eyebrow="How It Works"
        title="A standardized, repeatable process - powered by AI, checked by humans."
        description="Every project follows the same four-step workflow, so delivery stays fast and consistent without sacrificing quality."
      />
      <Process />
      <Trust />
      <Cta />
    </>
  );
}
