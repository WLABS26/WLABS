import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { PRICING } from "@/modules/shared/constants";
import { completeMockLeadCheckoutAction } from "./actions";

export const dynamic = "force-dynamic";

interface MockLeadCheckoutPageProps {
  params: Promise<{ leadId: string }>;
}

export async function generateMetadata({ params }: MockLeadCheckoutPageProps): Promise<Metadata> {
  const { leadId } = await params;
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { businessName: true } });
  return {
    title: `Checkout (test mode) — ${lead?.businessName ?? "Unknown"}`,
    robots: { index: false, follow: false },
  };
}

export default async function MockLeadCheckoutPage({ params }: MockLeadCheckoutPageProps) {
  const { leadId } = await params;
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, businessName: true } });
  if (!lead) notFound();

  const currencySymbol = PRICING.mvp.currency === "EUR" ? "€" : "";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-cyan">
        <ShieldCheck className="size-6" />
      </span>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-cyan">Test mode checkout</p>
      <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{PRICING.mvp.name}</h1>
      <p className="mt-2 text-sm text-muted">for {lead.businessName}</p>

      <div className="mt-8 w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">Total due today</span>
          <span className="text-2xl font-bold text-white">
            {currencySymbol}{PRICING.mvp.price}
          </span>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-muted">
          {PRICING.mvp.includes.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-brand-cyan">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-xs text-muted">
        Stripe is not configured for this environment. Submitting marks this lead as paid and auto-runs the
        full pipeline — no real payment is processed.
      </p>

      <form action={completeMockLeadCheckoutAction} className="mt-6 w-full">
        <input type="hidden" name="leadId" value={lead.id} />
        <button
          type="submit"
          className="w-full rounded-full bg-brand-cyan px-6 py-3 font-semibold text-brand-navy hover:opacity-90"
        >
          Pay {currencySymbol}{PRICING.mvp.price} (test mode)
        </button>
      </form>
    </div>
  );
}
