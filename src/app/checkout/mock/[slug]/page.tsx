import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { PRICING } from "@/modules/shared/constants";
import { getPreviewBySlug } from "@/modules/generator/preview-store";

import { completeMockCheckoutAction } from "./actions";

export const dynamic = "force-dynamic";

interface MockCheckoutPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: MockCheckoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const preview = await getPreviewBySlug(slug);
  const name = preview?.lead.businessName ?? "Checkout";
  return { title: `Checkout (test mode) — ${name}`, robots: { index: false, follow: false } };
}

/**
 * Local mock checkout, used when STRIPE_SECRET_KEY is not configured. Lets
 * the paid pipeline (priority queue, payment status, admin "Payments" view)
 * be exercised end-to-end without a real Stripe account.
 */
export default async function MockCheckoutPage({ params, searchParams }: MockCheckoutPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  const preview = await getPreviewBySlug(slug);

  if (!preview) notFound();

  if (preview.status !== "published" && preview.token && preview.token !== token) {
    notFound();
  }

  const previewHref = preview.token ? `/preview/${preview.slug}?token=${preview.token}` : `/preview/${preview.slug}`;
  const currencySymbol = PRICING.mvp.currency === "EUR" ? "€" : "";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-cyan">
        <ShieldCheck className="size-6" />
      </span>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-cyan">Test mode checkout</p>
      <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{PRICING.mvp.name}</h1>
      <p className="mt-2 text-sm text-muted">for {preview.lead.businessName}</p>

      <div className="mt-8 w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">Total due today</span>
          <span className="text-2xl font-bold text-white">
            {currencySymbol}
            {PRICING.mvp.price}
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
        Stripe is not configured for this environment, so this is a local test-mode checkout. No payment is
        processed — submitting marks this lead as paid so the priority queue and admin tools can be exercised
        end-to-end.
      </p>

      <form action={completeMockCheckoutAction} className="mt-6 w-full">
        <input type="hidden" name="previewSlug" value={preview.slug} />
        {token ? <input type="hidden" name="token" value={token} /> : null}
        <button
          type="submit"
          className="w-full rounded-full bg-brand-cyan px-6 py-3 font-semibold text-brand-navy hover:opacity-90"
        >
          Pay {currencySymbol}
          {PRICING.mvp.price} (test mode)
        </button>
      </form>

      <Link href={previewHref} className="mt-6 text-sm text-brand-cyan hover:underline">
        ← Cancel and go back to your preview
      </Link>
    </div>
  );
}
