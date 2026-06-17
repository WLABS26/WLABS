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
import { FadeIn } from "@/components/motion/fade-in";
import { WireframePage } from "./wireframe-page";

export const dynamic = "force-dynamic";

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string; payment?: string; mode?: string }>;
}

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const preview = await getPreviewBySlug(slug);
  const name = preview ? (preview.contentJson as unknown as PreviewContent).meta.businessName : "Preview";
  return { title: `${name} — Website Concept by WLABS`, robots: { index: false, follow: false } };
}

export default async function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const { slug } = await params;
  const { token, payment, mode } = await searchParams;
  const preview = await getPreviewBySlug(slug);

  if (!preview) notFound();

  if (preview.status !== "published" && preview.token && preview.token !== token) {
    notFound();
  }

  await recordPreviewView(preview.id);

  if (mode === "wireframe") {
    return <WireframePage preview={preview} />;
  }

  // Serve AI-generated interactive wireframe in a full-page iframe (primary experience).
  const wireframeHtml = preview.wireframeHtml;
  if (wireframeHtml) {
    const iframeSrc = `/api/wireframe/${slug}${token ? `?token=${token}` : ""}`;
    return (
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#0F172A" }}>
        {payment === "success" && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              background: "#16a34a",
              color: "#fff",
              padding: "13px 20px",
              textAlign: "center",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.1px",
            }}
          >
            ✓ Payment confirmed — we&apos;ll be in touch within 48 hours to begin your build!
          </div>
        )}
        {payment === "cancelled" && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              background: "#d97706",
              color: "#fff",
              padding: "13px 20px",
              textAlign: "center",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Checkout was cancelled — no payment was made. Ready when you are.
          </div>
        )}
        <iframe
          src={iframeSrc}
          title={`Website concept for ${preview.lead.businessName}`}
          style={{
            width: "100%",
            height: payment ? "calc(100% - 46px)" : "100%",
            border: "none",
            display: "block",
            marginTop: payment ? "46px" : 0,
          }}
        />
      </div>
    );
  }

  const content = preview.contentJson as unknown as PreviewContent;
  const theme = (preview.themeJson as unknown as PreviewTheme) ?? {
    from: BRAND.colors.blue,
    to: BRAND.colors.cyan,
    visualStyle: "modern",
    fontFamily: null,
  };
  const audit = preview.lead.audits[0];
  const gradient = `linear-gradient(135deg, ${theme.from}, ${theme.to})`;
  const checkoutHref = `/api/checkout/${preview.slug}${token ? `?token=${token}` : ""}`;
  const isPaid = preview.lead.paymentStatus === "paid";

  const heroImg = content.hero.heroImageUrl;
  const showFloatingBadge = (theme.visualStyle === "modern" || theme.visualStyle === "premium") && audit;
  const showGallery = (content.gallery?.images?.length ?? 0) >= 3;

  // Build a Google Maps embed URL from address + city (no API key needed)
  const mapQuery = [content.local.address, content.meta.city].filter(Boolean).join(", ");
  const mapEmbedUrl = mapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed&z=15`
    : null;

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: theme.fontFamily ? `${theme.fontFamily}, sans-serif` : undefined }}>
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
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-4 py-1.5 text-sm font-semibold text-emerald-300">
                <CheckCircle2 className="size-4" />
                Payment received
              </span>
            ) : (
              <a
                href={checkoutHref}
                className="rounded-full bg-brand-cyan px-4 py-1.5 text-sm font-semibold text-brand-navy hover:opacity-90"
              >
                Claim this website
              </a>
            )}
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

      {/* Payment status banners */}
      {payment === "success" && (
        <div className="bg-emerald-500 text-emerald-950">
          <div className="mx-auto max-w-6xl px-4 py-3 text-center text-sm font-medium">
            Payment received — thanks! We&apos;ll be in touch within {PRICING.mvp.turnaround.toLowerCase()} to kick off
            your redesign.
          </div>
        </div>
      )}
      {payment === "cancelled" && (
        <div className="bg-amber-200 text-amber-900">
          <div className="mx-auto max-w-6xl px-4 py-3 text-center text-sm font-medium">
            Checkout was cancelled — no payment was made. Ready whenever you are.
          </div>
        </div>
      )}

      {/* Mock site header */}
      <header className="sticky top-[52px] z-40 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-bold" style={{ color: theme.from }}>
            {content.meta.businessName}
          </span>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <span>Home</span>
            <a href="#services" className="hover:text-slate-900">Services</a>
            <a href="#why" className="hover:text-slate-900">Why us</a>
            <a href="#contact" className="hover:text-slate-900">Contact</a>
          </nav>
          {content.local.phone ? (
            <a
              href={`tel:${content.local.phone}`}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: gradient }}
            >
              {content.local.phone}
            </a>
          ) : (
            <a href="#contact" className="rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: gradient }}>
              {content.hero.primaryCta.label}
            </a>
          )}
        </div>
      </header>

      {/* Hero — full-bleed image or gradient */}
      <section className="relative min-h-[85vh] overflow-hidden text-white flex items-center">
        {heroImg ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImg}
              alt={`${content.meta.businessName} hero`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: gradient }} />
        )}

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-24">
          <FadeIn>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
              <Sparkles className="size-3.5 text-white/80" />
              {content.hero.eyebrow}
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              {content.hero.headline}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90 leading-relaxed">{content.hero.subheadline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
              >
                {content.hero.primaryCta.label}
                <ArrowRight className="size-4" />
              </a>
              <a
                href="#services"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                {content.hero.secondaryCta.label}
              </a>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-white/80">
              <CheckCircle2 className="size-4" />
              {content.hero.trustCue}
            </p>
          </FadeIn>
        </div>

        {/* Floating audit score badge */}
        {showFloatingBadge && (
          <div className="absolute bottom-8 right-6 z-10 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md sm:right-10">
            <p className="text-xs font-medium text-white/70">Current audit score</p>
            <p className="mt-0.5 text-3xl font-bold text-white">
              {audit.overallScore}
              <span className="text-base font-normal text-white/60">/100</span>
            </p>
            <p className="mt-1 text-xs font-semibold text-emerald-300">This redesign fixes it</p>
          </div>
        )}
      </section>

      {/* Before / after audit callout */}
      {audit && (
        <section className="border-b border-slate-100 bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
            <FadeIn>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
            </FadeIn>
            <FadeIn delay={0.1} className="flex items-center justify-center">
              <div className="flex items-center gap-3 text-slate-400">
                <span className="text-sm font-medium">This concept</span>
                <ArrowRight className="size-6" />
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="rounded-2xl border-2 p-6" style={{ borderColor: theme.to }}>
                <p className="flex items-center gap-2 text-sm font-medium" style={{ color: theme.from }}>
                  <TrendingUp className="size-4" /> The WLABS redesign
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  A clean, mobile-first homepage with a clear call to action, stronger trust cues, and faster routes to
                  contact you — built to convert more visitors into customers.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* Problem */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <FadeIn>
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">{content.problem.heading}</h2>
          </FadeIn>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {content.problem.points.map((point, i) => (
              <FadeIn key={point} delay={i * 0.08}>
                <div className="rounded-xl border border-slate-200 p-5 text-slate-700 transition-shadow hover:shadow-md">
                  {point}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <FadeIn>
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">{content.services.heading}</h2>
            {content.services.intro && (
              <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">{content.services.intro}</p>
            )}
          </FadeIn>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {content.services.items.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                {item.imageUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                    <div className="relative h-44 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1.5 text-sm text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="mb-3 inline-flex size-10 items-center justify-center rounded-lg text-white" style={{ background: gradient }}>
                      <CheckCircle2 className="size-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-1.5 text-sm text-slate-600">{item.description}</p>
                  </div>
                )}
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery — only shown when 3+ images available */}
      {showGallery && (
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <FadeIn>
              <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Our work</h2>
            </FadeIn>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {content.gallery!.images.map((img, i) => (
                <FadeIn key={img.url} delay={i * 0.07}>
                  <div className="aspect-square overflow-hidden rounded-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why us */}
      <section id="why" className={showGallery ? "bg-slate-50" : "bg-white"}>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <FadeIn>
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">{content.whyUs.heading}</h2>
          </FadeIn>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {content.whyUs.reasons.map((reason, i) => (
              <FadeIn key={reason.title} delay={i * 0.08}>
                <div className="border-l-2 pl-4" style={{ borderColor: theme.from }}>
                  <h3 className="font-semibold" style={{ color: theme.from }}>
                    {reason.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600">{reason.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <FadeIn>
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">{content.trust.heading}</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {content.trust.items.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Local + contact */}
      <section id="contact" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <FadeIn>
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">{content.local.heading}</h2>
          </FadeIn>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <FadeIn delay={0.08}>
              <div className="space-y-4 text-sm text-slate-700">
                {content.local.address && (
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0" style={{ color: theme.from }} />
                    {content.local.address}
                  </p>
                )}
                {content.local.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0" style={{ color: theme.from }} />
                    <a href={`tel:${content.local.phone}`} className="hover:underline">{content.local.phone}</a>
                  </p>
                )}
                {content.local.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0" style={{ color: theme.from }} />
                    <a href={`mailto:${content.local.email}`} className="hover:underline">{content.local.email}</a>
                  </p>
                )}
                {content.local.hours && (
                  <p className="text-slate-500">{content.local.hours}</p>
                )}
                {content.local.serviceArea && (
                  <p className="text-slate-500">Serving {content.local.serviceArea}.</p>
                )}

                {/* Map embed or placeholder */}
                {mapEmbedUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm" style={{ height: "220px" }}>
                    <iframe
                      src={mapEmbedUrl}
                      width="100%"
                      height="220"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map of ${content.meta.city ?? content.meta.businessName}`}
                    />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4" /> Map of {content.meta.city ?? "your area"}
                    </span>
                  </div>
                )}
              </div>
            </FadeIn>

            {/* Contact form mockup */}
            <FadeIn delay={0.12}>
              <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
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
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Final CTA + booking */}
      <section id="book" className="relative overflow-hidden text-white" style={{ background: gradient }}>
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center">
          <FadeIn>
            <h2 className="text-3xl font-bold sm:text-4xl">{content.finalCta.heading}</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/90 text-lg">{content.finalCta.subheading}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {isPaid ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-slate-900">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Payment received — we&apos;re on it
                </span>
              ) : (
                <a
                  href={checkoutHref}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
                >
                  Claim this website — {PRICING.mvp.currency === "EUR" ? "€" : ""}
                  {PRICING.mvp.price} fixed
                  <ArrowRight className="size-4" />
                </a>
              )}
              <a
                href={`mailto:${BRAND.contactEmail}?subject=Book a call: ${encodeURIComponent(content.meta.businessName)}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <Calendar className="size-4" />
                Book a 15-minute launch call
              </a>
            </div>
          </FadeIn>
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
