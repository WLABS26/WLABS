import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";

import { IntakeForm } from "@/components/forms/intake-form";
import type { PreviewContent } from "@/modules/generator/preview-types";
import { getPreviewBySlug } from "@/modules/generator/preview-store";

export const dynamic = "force-dynamic";

interface IntakePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: IntakePageProps): Promise<Metadata> {
  const { slug } = await params;
  const preview = await getPreviewBySlug(slug);
  const name = preview ? (preview.contentJson as unknown as PreviewContent).meta.businessName : "Intake";
  return { title: `Tell us about ${name} — WLABS`, robots: { index: false, follow: false } };
}

export default async function IntakePage({ params, searchParams }: IntakePageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  const preview = await getPreviewBySlug(slug);

  if (!preview) notFound();

  // Same access rule as the preview itself: unpublished previews require the matching token.
  if (preview.status !== "published" && preview.token && preview.token !== token) {
    notFound();
  }

  const content = preview.contentJson as unknown as PreviewContent;
  const previewHref = preview.token ? `/preview/${preview.slug}?token=${preview.token}` : `/preview/${preview.slug}`;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-cyan">
          <Sparkles className="size-6" />
        </span>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">A few quick details for {content.meta.businessName}</h1>
        <p className="mt-2 text-sm text-muted">
          We put together a preview concept for your business. Sharing a bit more helps us make it feel like yours.
        </p>
      </div>

      <div className="w-full">
        <IntakeForm slug={slug} token={token ?? null} />
      </div>

      <Link href={previewHref} className="mt-6 text-sm text-brand-cyan hover:underline">
        ← Back to your preview
      </Link>
    </div>
  );
}
