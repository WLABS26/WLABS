import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { BRAND, PRICING } from "@/modules/shared/constants";
import type { PreviewContent, PreviewTheme } from "@/modules/generator/preview-types";
import { getPreviewBySlug, recordPreviewView } from "@/modules/generator/preview-store";

export const dynamic = "force-dynamic";

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const preview = await getPreviewBySlug(slug);
  const name = preview ? (preview.contentJson as unknown as PreviewContent).meta.businessName : "Preview";
  return { title: `${name} — Website Concept by WLABS`, robots: { index: false, follow: false } };
}

export default async function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  const preview = await getPreviewBySlug(slug);

  if (!preview) notFound();

  // Private preview: unpublished previews require the matching token.
  if (preview.status !== "published" && preview.token && preview.token !== token) {
    notFound();
  }

  await recordPreviewView(preview.id);

  const content = preview.contentJson as unknown as PreviewContent;
  const theme = (preview.themeJson as unknown as PreviewTheme) ?? {
    from: BRAND.colors.blue,
    to: BRAND.colors.cyan,
    visualStyle: "modern",
  };
  const audit = preview.lead.audits[0];
  const gradient = `linear-gradient(135deg, ${theme.from}, ${theme.to})`;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* WLABS preview banner */}
      <div className="sticky top-0 z-50 bg-brand-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 shrink-0 text-brand-cyan" />
            <span>
              Preview concept by <strong>WLABS</strong> — an unpublished redesign for{" "}
              <strong>{content.meta.businessName}</strong>.
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`${BRAND.contactEmail ? `mailto:${BRAND.contactEmail}` : "#"}?subject=Claim my website: ${encodeURIComponent(content.meta.businessName)}`}
              className="rounded-full bg-brand-cyan px-4 py-1.5 text-sm font-semibold text-brand-navy hover:opacity-90"
            >
              Claim this website
            </a>
            <a
              href="#book"
              className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10"
            >
              Book a 15-min call
            </a>
            <a
              href={`mailto:${BRAND.contactEmail}?subject=Changes to my preview: ${encodeURIComponent(content.meta.businessName)}`}
              className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10"
            >
              Request changes
            </a>
          </div>
        </div>
      </div>

      {/* Mock site header */}
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-bold" style={{ color: theme.from }}>
            {content.meta.businessName}
          </span>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <span>Home</span>
            <a href="#services">Services</a>
            <a href="#why">Why us</a>
            <a href="#contact">Contact</a>
          </nav>
          {content.local.phone ? (
            <a
              href={`tel:${content.local.phone}`}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ background: gradient }}
            >
              {content.local.phone}
            </a>
          ) : (
            <a href="#contact" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: gradient }}>
              {content.hero.primaryCta.label}
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden text-white" style={{ background: gradient }}>
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-white/80">{content.hero.eyebrow}</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">{content.hero.headline}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90">{content.hero.subheadline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#contact" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-white/90">
              {content.hero.primaryCta.label}
              <ArrowRight className="size-4" />
            </a>
            <a href="#services" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10">
              {content.hero.secondaryCta.label}
            </a>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-white/80">
            <CheckCircle2 className="size-4" />
            {content.hero.trustCue}
          </p>
        </div>
      </section>

      {/* Before / after audit callout */}
      {audit && (
        <section className="border-b border-slate-100 bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-500">Current website score</p>
              <p className="mt-1 text-4xl font-bold text-slate-900">
                {audit.overallScore}
                <span className="text-lg text-slate-400">/100</span>
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                {((audit.topIssuesJson as string[] | null) ?? []).slice(0, 3).map((issue) => (
                  <li key={issue} className="flex gap-2">
                    <span className="text-rose-500">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3 text-slate-400">
                <span className="text-sm font-medium">This concept</span>
                <ArrowRight className="size-6" />
              </div>
            </div>
            <div className="rounded-2xl border-2 p-6" style={{ borderColor: theme.to }}>
              <p className="flex items-center gap-2 text-sm font-medium" style={{ color: theme.from }}>
                <TrendingUp className="size-4" /> The WLABS redesign
              </p>
              <p className="mt-2 text-sm text-slate-700">
                A clean, mobile-first homepage with a clear call to action, stronger trust cues, and faster routes to
                contact you — built to convert more visitors into customers.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Problem */}
      <Section heading={content.problem.heading}>
        <div className="grid gap-4 sm:grid-cols-3">
          {content.problem.points.map((point) => (
            <div key={point} className="rounded-xl border border-slate-200 p-5 text-slate-700">
              {point}
            </div>
          ))}
        </div>
      </Section>

      {/* Services */}
      <Section id="services" heading={content.services.heading} intro={content.services.intro} tinted>
        <div className="grid gap-6 sm:grid-cols-3">
          {content.services.items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-lg text-white" style={{ background: gradient }}>
                <CheckCircle2 className="size-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Why us */}
      <Section id="why" heading={content.whyUs.heading}>
        <div className="grid gap-6 sm:grid-cols-3">
          {content.whyUs.reasons.map((reason) => (
            <div key={reason.title}>
              <h3 className="font-semibold" style={{ color: theme.from }}>
                {reason.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600">{reason.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Trust */}
      <Section heading={content.trust.heading} tinted>
        <div className="flex flex-wrap justify-center gap-3">
          {content.trust.items.map((item) => (
            <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
              {item}
            </span>
          ))}
        </div>
      </Section>

      {/* Local + contact */}
      <Section id="contact" heading={content.local.heading}>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4 text-sm text-slate-700">
            {content.local.address && (
              <p className="flex items-center gap-2">
                <MapPin className="size-4" style={{ color: theme.from }} />
                {content.local.address}
              </p>
            )}
            {content.local.phone && (
              <p className="flex items-center gap-2">
                <Phone className="size-4" style={{ color: theme.from }} />
                {content.local.phone}
              </p>
            )}
            {content.local.email && (
              <p className="flex items-center gap-2">
                <Mail className="size-4" style={{ color: theme.from }} />
                {content.local.email}
              </p>
            )}
            {content.local.serviceArea && <p className="text-slate-500">Serving {content.local.serviceArea}.</p>}
            <div className="flex h-48 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <MapPin className="size-4" /> Map of {content.meta.city ?? "your area"}
              </span>
            </div>
          </div>

          {/* Contact form mockup */}
          <div className="rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900">{content.contact.heading}</h3>
            <p className="mt-1 text-sm text-slate-500">{content.contact.subheading}</p>
            <div className="mt-4 space-y-3">
              {content.contact.fields.map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{field}</label>
                  {field === "Message" ? (
                    <div className="h-20 rounded-lg border border-slate-200 bg-slate-50" />
                  ) : (
                    <div className="h-10 rounded-lg border border-slate-200 bg-slate-50" />
                  )}
                </div>
              ))}
              <button type="button" disabled className="w-full rounded-lg px-4 py-2.5 font-semibold text-white" style={{ background: gradient }}>
                {content.hero.primaryCta.label}
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Final CTA + booking */}
      <section id="book" className="text-white" style={{ background: gradient }}>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold">{content.finalCta.heading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">{content.finalCta.subheading}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={`mailto:${BRAND.contactEmail}?subject=Claim my website: ${encodeURIComponent(content.meta.businessName)}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-white/90"
            >
              Claim this website — {PRICING.mvp.currency === "EUR" ? "€" : ""}
              {PRICING.mvp.price} fixed
            </a>
            <a
              href={`mailto:${BRAND.contactEmail}?subject=Book a call: ${encodeURIComponent(content.meta.businessName)}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              <Calendar className="size-4" />
              Book a 15-minute launch call
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-white">{content.meta.businessName}</p>
            <p className="text-sm text-slate-400">{content.meta.tagline}</p>
          </div>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <MessageSquare className="size-3.5" />
            Concept by WLABS — Website Laboratory. Not affiliated with {content.meta.businessName} until claimed.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Section({
  id,
  heading,
  intro,
  tinted,
  children,
}: {
  id?: string;
  heading: string;
  intro?: string;
  tinted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={tinted ? "bg-slate-50" : "bg-white"}>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">{heading}</h2>
        {intro && <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">{intro}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
