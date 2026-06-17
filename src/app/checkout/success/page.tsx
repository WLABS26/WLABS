import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment received — WLABS",
  robots: { index: false, follow: false },
};

interface CheckoutSuccessPageProps {
  searchParams: Promise<{ lead?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const { lead: leadId } = await searchParams;

  const lead = leadId
    ? await prisma.lead.findUnique({ where: { id: leadId }, select: { businessName: true } })
    : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-green-500/15 text-green-400">
        <CheckCircle2 className="size-7" />
      </span>

      <h1 className="text-2xl font-bold text-white sm:text-3xl">Payment received!</h1>

      {lead && (
        <p className="mt-2 text-base text-muted">
          Thank you, we got your order for <span className="text-white">{lead.businessName}</span>.
        </p>
      )}

      <p className="mt-4 text-sm text-muted">
        Your website concept is being prepared. We&apos;ll reach out within 24 hours with your personalised
        wireframe and next steps.
      </p>

      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/5"
      >
        Back to WLABS
      </Link>
    </div>
  );
}
