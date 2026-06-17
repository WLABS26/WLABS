import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getLeadBySlug } from "@/modules/crm/leads";
import { isMockProvider } from "@/lib/ai/provider";
import type { WireframeChatMessage } from "./actions";
import { WireframeChat } from "./wireframe-chat";

interface WireframeEditorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: WireframeEditorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lead = await getLeadBySlug(slug);
  return { title: lead ? `Wireframe editor — ${lead.businessName}` : "Wireframe editor" };
}

export default async function WireframeEditorPage({ params }: WireframeEditorPageProps) {
  const { slug } = await params;
  const lead = await getLeadBySlug(slug);
  if (!lead) notFound();

  const preview = lead.previews.find((p) => p.wireframeHtml);

  if (!preview) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-muted">No wireframe yet for this lead.</p>
        <Link href={`/admin/leads/${slug}`} className="text-sm text-brand-cyan hover:underline">
          ← Back — generate a preview first
        </Link>
      </div>
    );
  }

  const wireframeUrl = `/api/wireframe/${preview.slug}${preview.token ? `?token=${preview.token}` : ""}`;
  const chat = (preview.wireframeChatJson as WireframeChatMessage[] | null) ?? [];
  const aiEnabled = !isMockProvider();

  return (
    // Full-bleed: cancel the dashboard container's padding so the editor uses the whole main area.
    <div className="-mx-4 -my-6 flex h-[100dvh] flex-col overflow-hidden sm:-mx-6 lg:-mx-8 lg:-my-10">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 shrink-0">
        <Link href={`/admin/leads/${slug}`} className="flex items-center gap-1.5 text-sm text-muted hover:text-white">
          <ArrowLeft className="size-4" />
          {lead.businessName}
        </Link>
        <span className="text-muted/40">·</span>
        <span className="text-sm text-white">Wireframe editor</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: wireframe iframe */}
        <div className="flex-1 overflow-hidden bg-black">
          <iframe
            src={wireframeUrl}
            className="h-full w-full border-0"
            title={`${lead.businessName} wireframe`}
          />
        </div>

        {/* Right: chat panel */}
        <div className="flex w-[400px] shrink-0 flex-col border-l border-white/10 bg-[#0f1117] xl:w-[460px]">
          <div className="px-4 py-3 border-b border-white/10 shrink-0">
            <p className="text-sm font-medium text-white">Change requests</p>
            <p className="text-xs text-muted">Opus rewrites the wireframe on each send</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <WireframeChat previewId={preview.id} leadSlug={slug} initialChat={chat} aiEnabled={aiEnabled} />
          </div>
        </div>
      </div>
    </div>
  );
}
