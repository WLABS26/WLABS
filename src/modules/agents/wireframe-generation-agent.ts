/**
 * Wireframe Generation Agent.
 *
 * Generates a self-contained interactive HTML wireframe for a prospect — their
 * first look at their redesigned site. Quality benchmark: the Claude Design
 * "Dr. Becker" reference (warm sophisticated palette, paired premium fonts,
 * embedded photography, floating bobbing cards, scroll-reveal, dark contrast
 * bands, gradient CTA). Uses the top-tier Opus model; falls back to a
 * benchmark-quality template in mock mode. Never fabricates specific reviews,
 * ratings, awards, or statistics.
 */
import { z } from "zod";

import { generateText } from "@/lib/ai/generate";
import { Agent } from "./base-agent";

const inputSchema = z.object({
  businessName: z.string(),
  industry: z.string(),
  industryLabel: z.string(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  contactPhone: z.string().nullable(),
  contactEmail: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  auditScore: z.number().nullable(),
  topIssues: z.array(z.string()).default([]),
  criticalFindings: z.array(z.string()).default([]),
  extractedTitle: z.string().nullable(),
  extractedH1: z.string().nullable(),
  extractedMetaDescription: z.string().nullable(),
  extractedText: z.string().nullable(),
  heroImageUrl: z.string(),
  philosophyImageUrl: z.string(),
  galleryImages: z.array(z.string()).default([]),
  brandColors: z.array(z.string()).default([]),
  addressHint: z.string().nullable(),
  language: z.enum(["en", "de"]).default("en"),
});

const outputSchema = z.object({
  wireframeHtml: z.string().min(500),
});

export type WireframeInput = z.infer<typeof inputSchema>;
export type WireframeOutput = z.infer<typeof outputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Per-industry design palettes (Dr. Becker-grade sophistication)
// ─────────────────────────────────────────────────────────────────────────────

interface Palette {
  primary: string;
  primaryDark: string;
  deep: string;
  deepEnd: string;
  tint: string;
  tintText: string;
  paper: string;
  paperAlt: string;
  ink: string;
  body: string;
  muted: string;
  border: string;
  accent: string;
  onDark: string;
  onDarkMuted: string;
  fontHead: string;
  fontBody: string;
  fontQuery: string;
}

const PALETTES: Record<string, Palette> = {
  // Calm, trustworthy greens — medical / dental / physio (the Dr. Becker family)
  sage: {
    primary: "#3F5C4E", primaryDark: "#34503F", deep: "#22312A", deepEnd: "#2E4339",
    tint: "#EAF1EC", tintText: "#3F5C4E", paper: "#FBFAF7", paperAlt: "#F4F2EB",
    ink: "#1E2B24", body: "#5C5A54", muted: "#8A8780", border: "#ECEAE3", accent: "#E0A92E",
    onDark: "#C9D2CB", onDarkMuted: "#8FBBA4",
    fontHead: "Schibsted Grotesk", fontBody: "Hanken Grotesk",
    fontQuery: "family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700",
  },
  // Elegant navy + cream — law / accounting / finance
  navy: {
    primary: "#1A2C50", primaryDark: "#14223F", deep: "#15233F", deepEnd: "#1E325A",
    tint: "#EBEEF4", tintText: "#1A2C50", paper: "#FCFBF8", paperAlt: "#F3F1EA",
    ink: "#161E2E", body: "#54596A", muted: "#8A8C99", border: "#E8E6DF", accent: "#C0A062",
    onDark: "#CDD4E0", onDarkMuted: "#93A0BC",
    fontHead: "Cormorant Garamond", fontBody: "Inter",
    fontQuery: "family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700",
  },
  // Confident trust-blue — plumber / electrician
  azure: {
    primary: "#15609B", primaryDark: "#114E7E", deep: "#10243A", deepEnd: "#163850",
    tint: "#E4EFF6", tintText: "#15609B", paper: "#FAFBFC", paperAlt: "#EFF3F6",
    ink: "#13202C", body: "#51606C", muted: "#86919B", border: "#E5EAEE", accent: "#E8821E",
    onDark: "#C4D2DD", onDarkMuted: "#7E9DB4",
    fontHead: "Barlow Semi Condensed", fontBody: "Barlow",
    fontQuery: "family=Barlow+Semi+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600;700",
  },
  // Warm burgundy + cream — restaurant / food
  wine: {
    primary: "#7B2230", primaryDark: "#641A26", deep: "#2C1518", deepEnd: "#43211F",
    tint: "#F4E9E5", tintText: "#7B2230", paper: "#FCF8F4", paperAlt: "#F3EBE2",
    ink: "#2A1A18", body: "#5F5048", muted: "#917F74", border: "#ECE3DA", accent: "#C8893B",
    onDark: "#E0CFC4", onDarkMuted: "#B89683",
    fontHead: "Playfair Display", fontBody: "Lato",
    fontQuery: "family=Playfair+Display:wght@500;600;700;800&family=Lato:wght@400;700",
  },
  // Soft rose — beauty / aesthetic clinic
  rose: {
    primary: "#A8456A", primaryDark: "#8E3757", deep: "#2E1822", deepEnd: "#45222F",
    tint: "#F7E9EE", tintText: "#A8456A", paper: "#FFF9FB", paperAlt: "#F8EEF1",
    ink: "#2B1922", body: "#665159", muted: "#9C8189", border: "#F0E2E6", accent: "#C9A05A",
    onDark: "#E6D2DA", onDarkMuted: "#C195A6",
    fontHead: "Cormorant Garamond", fontBody: "Poppins",
    fontQuery: "family=Cormorant+Garamond:wght@500;600;700&family=Poppins:wght@300;400;500;600;700",
  },
  // Deep violet / charcoal — real estate / premium
  violet: {
    primary: "#3A2C63", primaryDark: "#2E2250", deep: "#1A1433", deepEnd: "#2A2150",
    tint: "#ECE8F4", tintText: "#3A2C63", paper: "#FCFBFD", paperAlt: "#F2EFF6",
    ink: "#191228", body: "#544E66", muted: "#8A8499", border: "#E8E4EE", accent: "#C2A35A",
    onDark: "#D2CCE2", onDarkMuted: "#9990B6",
    fontHead: "Raleway", fontBody: "Hanken Grotesk",
    fontQuery: "family=Raleway:wght@500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700",
  },
  // Grounded terracotta / amber — construction
  clay: {
    primary: "#B65A2E", primaryDark: "#984924", deep: "#2A1D16", deepEnd: "#42301F",
    tint: "#F5EAE2", tintText: "#B65A2E", paper: "#FBF9F6", paperAlt: "#F2ECE4",
    ink: "#241A14", body: "#5C5249", muted: "#8E8077", border: "#EAE3DA", accent: "#3F6F52",
    onDark: "#DACBBE", onDarkMuted: "#B0937E",
    fontHead: "Sora", fontBody: "Inter",
    fontQuery: "family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700",
  },
  // Refined neutral blue-grey — general / other
  slate: {
    primary: "#2D4A63", primaryDark: "#243C51", deep: "#19242E", deepEnd: "#243744",
    tint: "#E8EEF2", tintText: "#2D4A63", paper: "#FBFBFA", paperAlt: "#F0F2F3",
    ink: "#16212B", body: "#525C66", muted: "#869099", border: "#E7EAEC", accent: "#D08A2C",
    onDark: "#CAD4DC", onDarkMuted: "#869AAA",
    fontHead: "Schibsted Grotesk", fontBody: "Inter",
    fontQuery: "family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700",
  },
};

const INDUSTRY_PALETTE: Record<string, keyof typeof PALETTES> = {
  dentist: "sage",
  physiotherapist: "sage",
  lawyer: "navy",
  accountant: "navy",
  plumber: "azure",
  electrician: "azure",
  restaurant: "wine",
  beauty_clinic: "rose",
  real_estate: "violet",
  construction: "clay",
  other: "slate",
};

function getPalette(industry: string): Palette {
  return PALETTES[INDUSTRY_PALETTE[industry] ?? "slate"];
}

// ─────────────────────────────────────────────────────────────────────────────
// Opus system prompt — the Dr. Becker design language, baked in
// ─────────────────────────────────────────────────────────────────────────────

const WIREFRAME_SYSTEM_PROMPT = `You are an elite frontend designer-developer at a top web studio. You produce a single, complete, self-contained interactive HTML wireframe that shows a local business what their redesigned website could look like. This is a high-stakes sales artifact: the quality bar is an Awwwards / CSS Design Awards finalist, and it must visually rival a bespoke Claude Design handoff.

━━━ OUTPUT FORMAT ━━━
Return ONLY the raw HTML document. No markdown, no code fences, no commentary. Start with <!DOCTYPE html> and end with </html>.

━━━ THE REFERENCE STANDARD (study this — match its sophistication) ━━━
The gold standard is a calm, content-rich, multi-section marketing page with ALL styling inline. Exact design tokens you must work at this level of refinement:

• Warm, non-generic page background (never pure #FFF or #FAFAFA — use a warm paper tone like #FBFAF7 or the palette's paper value).
• Two paired Google Fonts: a Grotesk/Display for headings (tight letter-spacing −.02em to −.025em on large headings) + a clean grotesk for body.
• Type scale: Hero H1 56–60px / line-height 1.04 / weight 700; Section H2 38–40px / −.02em; Card H3 21–22px; stat numbers 26–27px; body 15–19px / line-height 1.6–1.7; eyebrow labels 13px / weight 600 / letter-spacing .16em / UPPERCASE / colored.
• Layout: max-width 1200px; side padding 32px; section vertical rhythm 80–88px; card padding 28–36px; grid gaps 16–24px.
• Radius: pills/buttons 999px; cards 18–22px; feature images / CTA bands 24–28px; icon chips 12–15px.
• Shadows (soft, directional): card hover 0 26px 50px -28px rgba(30,40,35,.35); hero image 0 40px 80px -40px rgba(40,60,50,.5); floating cards 0 18-22px 40-46px -16px; primary button 0 12px 28px -10px.
• Scroll-reveal: IntersectionObserver adds reveal (opacity 0→1 + translateY(28px)→0, transition .8s cubic-bezier(.22,1,.36,1), threshold 0.1, once each).
• Sticky translucent nav (backdrop-filter blur(12px) saturate(140%)), 1px bottom border, gains a soft shadow after 12px scroll.
• Floating cards over the hero image that gently bob (@keyframes floaty translateY ±9px, 5–6s infinite).
• Hover lifts on cards (translateY(-4px)); buttons darken on hover.

━━━ REQUIRED SECTIONS (top → bottom) ━━━
1. NAV — sticky, translucent: left = rounded square logo mark (inline SVG glyph fitting the industry) + wordmark with a small uppercase sublabel; center = 4 anchor links (active link gets a tint pill); right = phone link (with phone SVG) + primary pill CTA. Add a hamburger that opens a full-screen overlay menu below 768px.
2. HERO — two-column grid (≈1.05fr / .95fr). LEFT: a tint status/eyebrow pill, a 3-line display H1, a 1–2 sentence subcopy, two CTAs (primary solid pill + outline pill), and a stat row (3 stats separated by thin dividers — use ONLY verifiable/neutral stats like years pattern, city, "lokal"; never invent ratings/counts). RIGHT: a 4:5 hero photo in a 28px-radius frame with the big soft shadow, plus TWO floating bobbing cards overlapping it (e.g. a small feature card and a info chip) — but the floating cards must NOT state fabricated review counts or ratings.
3. TRUST STRIP — white/paper band, 1px top+bottom border, 4 icon+label items (each: tint rounded-square chip with an inline SVG + bold label + muted sublabel). Generic verifiable virtues only.
4. FOCUS / SCHWERPUNKTE — centered eyebrow + H2, then 3 cards with a colored rounded-square SVG icon, H3, description, and a "Learn more →" link. Hover lift.
5. SERVICES PREVIEW — a responsive grid of 6 tint list-chips (label + arrow), linking to #services.
6. PHILOSOPHY / ABOUT — two-column: one side an image (use the philosophy photo; you MAY apply an organic morphing border-radius via @keyframes blobPulse), other side eyebrow + H2 + two paragraphs + an outline CTA.
7. GALLERY — a 3-up grid of real photos (use the provided gallery image URLs) with rounded corners and a subtle hover zoom.
8. HOURS + LOCATION — a DARK band (deep palette color), two columns: left = hours/availability with an "open now"-style status pill and weekday rows (today's row tinted); right = a styled map panel (if an address is given, embed <iframe src="https://maps.google.com/maps?q=ADDRESS&output=embed">) + two small info cards (parking / transit / contact).
9. REVIEWS — centered header + 3 testimonial cards. CRITICAL: you must NOT fabricate real customer quotes, names, or star ratings/platforms. Instead render this as an honest placeholder: a small caption like "Platzhalter — hier erscheinen Ihre echten Bewertungen" (DE) / "Placeholder — your real reviews will appear here" (EN), and 3 skeleton review cards (star outline, illustrative sample sentiment in muted/italic, generic initials avatar). It must look designed, not fake.
10. CTA BAND — a rounded-28px gradient panel (primary → deepEnd) with a decorative translucent circle, a headline, subcopy, and two CTAs (solid white pill + outline phone pill).
11. FOOTER — dark band, brand blurb + 3 columns (navigation, contact, hours) + bottom bar with © year and legal links.

━━━ IMAGES ━━━
Use the EXACT image URLs provided in the prompt for hero, philosophy, and gallery. Embed as <img> with object-fit:cover. EVERY <img> MUST include this exact onerror so a broken image degrades to its gradient frame, never a broken icon:
onerror="this.style.display='none'"
…and its parent container must already have a palette gradient background behind the image.

━━━ ABSOLUTE RULES ━━━
1. NEVER fabricate specific testimonials, named reviews, star ratings, review counts, awards, certifications, or statistics. The reviews section is an explicit honest placeholder (see #9). Floating hero cards never show fake ratings/counts.
2. Do not reference the audit score, "WLABS", or the analysis anywhere in the customer-facing content (one small dismissible "Concept by WLABS" badge fixed bottom-right is the only exception).
3. Use the prospect's real name, city, phone, email, and address where provided. Use tel:/mailto: links.
4. All copy in the requested language. German uses formal "Sie".
5. Single file: all CSS in <style>, all JS in <script>, only Google Fonts as an external link. Mobile-first responsive: grids collapse to 1 column under 720px; nav → hamburger under 768px; clamp() font sizes; 44px min touch targets.
6. Inline SVG icons only (no icon libraries/emojis as primary icons — small emoji accents in dark info cards are acceptable).`;

function buildWireframePrompt(input: WireframeInput): string {
  const p = getPalette(input.industry);
  const lang = input.language === "de" ? "German (formal Sie)" : "English";
  const brand = input.brandColors.length > 0 ? input.brandColors.join(", ") : "none extracted";
  const gallery = input.galleryImages.length > 0 ? input.galleryImages.map((g, i) => `  gallery[${i}]: ${g}`).join("\n") : "  (none — reuse hero/philosophy or use tint gradient panels)";

  return `Generate the complete interactive HTML wireframe. Language for ALL copy: ${lang}.

━━━ BUSINESS ━━━
Name: ${input.businessName}
Industry: ${input.industryLabel} (key: ${input.industry})
City: ${input.city ?? "—"}${input.country ? `, ${input.country}` : ""}
Phone: ${input.contactPhone ?? "not available"}
Email: ${input.contactEmail ?? "not available"}
Address: ${input.addressHint ?? "not available"}
Current website: ${input.websiteUrl ?? "—"}

━━━ PALETTE TO USE (work at this exact level of refinement) ━━━
primary ${p.primary} · primaryHover ${p.primaryDark} · darkBand ${p.deep} → ${p.deepEnd}
tint ${p.tint} (text ${p.tintText}) · paper ${p.paper} · paperAlt ${p.paperAlt}
ink ${p.ink} · body ${p.body} · muted ${p.muted} · hairline ${p.border} · accent ${p.accent}
onDark ${p.onDark} · onDarkMuted ${p.onDarkMuted}
Fonts: "${p.fontHead}" (headings, tight tracking) + "${p.fontBody}" (body).
Google Fonts link: https://fonts.googleapis.com/css2?${p.fontQuery}&display=swap
Brand colors extracted from their site (optional nudge): ${brand}

━━━ IMAGES (embed these EXACT urls; every <img> needs onerror="this.style.display='none'") ━━━
  hero (4:5): ${input.heroImageUrl}
  philosophy: ${input.philosophyImageUrl}
${gallery}

━━━ EXISTING SITE CONTEXT (understand the business; do NOT copy verbatim) ━━━
Title: ${input.extractedTitle ?? "—"}
H1: ${input.extractedH1 ?? "—"}
Meta: ${input.extractedMetaDescription ?? "—"}
${input.extractedText ? `Excerpt:\n${input.extractedText.slice(0, 1800)}` : "No content extracted."}

━━━ PROBLEMS THE REDESIGN SHOULD QUIETLY FIX (don't mention in copy) ━━━
${input.topIssues.length ? input.topIssues.slice(0, 5).map((i) => `• ${i}`).join("\n") : "—"}
${input.criticalFindings.length ? input.criticalFindings.slice(0, 3).map((f) => `• ${f}`).join("\n") : ""}

Produce the full HTML now.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock fallback — benchmark-quality template (used when no AI provider)
// ─────────────────────────────────────────────────────────────────────────────

function img(src: string, alt: string, extra = ""): string {
  return `<img src="${src}" alt="${alt}" loading="lazy" onerror="this.style.display='none'" style="width:100%; height:100%; object-fit:cover; ${extra}">`;
}

function buildMockWireframe(input: WireframeInput): string {
  const p = getPalette(input.industry);
  const year = new Date().getFullYear();
  const de = input.language === "de";
  const phone = input.contactPhone;
  const email = input.contactEmail;
  const addr = input.addressHint;
  const label = input.industryLabel;
  const gallery = input.galleryImages.length >= 3 ? input.galleryImages : [input.heroImageUrl, input.philosophyImageUrl, input.heroImageUrl];

  const nav = de ? ["Start", "Leistungen", "Über uns", "Kontakt"] : ["Home", "Services", "About", "Contact"];
  const navHref = ["#top", "#services", "#about", "#contact"];
  const ctaLabel = de ? "Termin anfragen" : "Get in touch";
  const heroTitle = de ? `Professionell.<br>Persönlich.<br>In ${input.city ?? "Ihrer Nähe"}.` : `Professional.<br>Personal.<br>Local to ${input.city ?? "you"}.`;
  const heroSub = de
    ? `${input.businessName} bietet hochwertige ${label}-Leistungen — verständlich, zuverlässig und auf Sie persönlich abgestimmt.`
    : `${input.businessName} delivers high-quality ${label.toLowerCase()} — clear, reliable and built entirely around you.`;

  const reviewNote = de ? "Platzhalter — hier erscheinen Ihre echten Bewertungen" : "Placeholder — your real reviews will appear here";
  const sampleReviews = de
    ? [
        "Sehr freundliches Team, kompetente Beratung und ein rundum angenehmer Ablauf von Anfang bis Ende.",
        "Pünktliche Termine, kurze Wartezeiten und alles wurde verständlich erklärt. Gerne wieder.",
        "Professionell, zuverlässig und persönlich — genau so wünscht man sich den Service vor Ort.",
      ]
    : [
        "Wonderful team, expert advice, and a smooth, pleasant experience from start to finish.",
        "On-time appointments, short waits, and everything explained clearly. Highly recommend.",
        "Professional, reliable and personal — exactly the kind of local service you hope to find.",
      ];

  const chips = de
    ? ["Erstberatung", "Beratung vor Ort", "Individuelle Lösungen", "Schneller Service", "Faire Preise", "Nachbetreuung"]
    : ["Free consultation", "On-site visits", "Tailored solutions", "Fast turnaround", "Fair pricing", "Aftercare"];

  return `<!DOCTYPE html>
<html lang="${input.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${input.businessName} — ${de ? "Website-Konzept" : "Website Concept"}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${p.fontQuery}&display=swap" rel="stylesheet">
<style>
  *{ box-sizing:border-box; }
  html{ scroll-behavior:smooth; }
  body{ margin:0; background:${p.paper}; color:${p.body}; font-family:'${p.fontBody}',sans-serif; overflow-x:hidden; }
  a{ text-decoration:none; }
  h1,h2,h3{ font-family:'${p.fontHead}',serif; color:${p.ink}; margin:0; }
  .wrap{ max-width:1200px; margin:0 auto; padding:0 32px; }
  .eyebrow{ font-family:'${p.fontHead}',sans-serif; font-size:13px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:${p.primary}; }
  .btn{ display:inline-flex; align-items:center; gap:8px; font-size:16px; font-weight:600; padding:15px 28px; border-radius:999px; cursor:pointer; transition:all .25s; }
  .btn-primary{ background:${p.primary}; color:#fff; box-shadow:0 12px 28px -10px ${p.primary}b3; border:none; }
  .btn-primary:hover{ background:${p.primaryDark}; transform:translateY(-1px); }
  .btn-outline{ background:#fff; color:${p.ink}; border:1.5px solid ${p.border}; }
  .btn-outline:hover{ border-color:${p.primary}; }
  .reveal{ opacity:0; transform:translateY(28px); transition:opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1); }
  .reveal.vis{ opacity:1; transform:none; }
  section{ position:relative; }
  @keyframes floaty{ 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-9px);} }
  @keyframes blobPulse{ 0%,100%{ border-radius:46% 54% 56% 44%/52% 48% 52% 48%;} 50%{ border-radius:54% 46% 44% 56%/48% 54% 46% 52%;} }

  /* WLABS badge */
  #wlabs{ position:fixed; bottom:22px; right:22px; z-index:9999; background:${p.deep}; color:#fff; font-size:11px; font-weight:600; letter-spacing:.3px; padding:9px 15px; border-radius:999px; cursor:pointer; opacity:.9; box-shadow:0 8px 22px -8px rgba(0,0,0,.5); }
  #wlabs:hover{ opacity:1; }

  /* Nav */
  nav#bar{ position:sticky; top:0; z-index:60; background:${p.paper}e0; backdrop-filter:saturate(140%) blur(12px); -webkit-backdrop-filter:saturate(140%) blur(12px); border-bottom:1px solid ${p.border}; transition:box-shadow .3s; }
  nav#bar.scrolled{ box-shadow:0 8px 28px -18px rgba(30,40,35,.55); }
  .navrow{ display:flex; align-items:center; justify-content:space-between; padding:14px 32px; max-width:1200px; margin:0 auto; }
  .logo{ display:flex; align-items:center; gap:11px; }
  .logo-mark{ width:40px; height:40px; border-radius:12px; background:${p.primary}; display:flex; align-items:center; justify-content:center; flex:none; }
  .logo-name{ font-family:'${p.fontHead}',sans-serif; font-weight:700; font-size:18px; color:${p.ink}; line-height:1; letter-spacing:-.01em; }
  .logo-sub{ font-size:11px; color:${p.muted}; letter-spacing:.08em; text-transform:uppercase; margin-top:3px; }
  .navlinks{ display:flex; align-items:center; gap:4px; }
  .navlinks a{ color:${p.body}; font-size:15px; font-weight:600; padding:9px 16px; border-radius:10px; transition:background .2s; }
  .navlinks a:hover{ background:${p.paperAlt}; }
  .navlinks a.active{ color:${p.ink}; background:${p.tint}; }
  .navphone{ display:flex; align-items:center; gap:8px; color:${p.primary}; font-size:15px; font-weight:600; }
  .navcta{ background:${p.primary}; color:#fff; font-size:14px; font-weight:600; padding:11px 20px; border-radius:999px; box-shadow:0 6px 16px -6px ${p.primary}b3; }
  .navcta:hover{ background:${p.primaryDark}; }
  .burger{ display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:8px; }
  .burger span{ width:22px; height:2px; background:${p.ink}; border-radius:2px; display:block; }
  #overlay{ display:none; position:fixed; inset:0; z-index:80; background:${p.deep}f5; flex-direction:column; align-items:center; justify-content:center; gap:14px; }
  #overlay.open{ display:flex; }
  #overlay a{ color:#fff; font-size:26px; font-weight:700; font-family:'${p.fontHead}',sans-serif; }

  /* Hero */
  .hero{ display:grid; grid-template-columns:1.05fr .95fr; gap:56px; align-items:center; padding:64px 0 44px; }
  .status-pill{ display:inline-flex; align-items:center; gap:9px; background:${p.tint}; color:${p.tintText}; font-size:13px; font-weight:600; padding:8px 15px; border-radius:999px; margin-bottom:26px; }
  .status-dot{ width:8px; height:8px; border-radius:50%; background:#43A047; box-shadow:0 0 0 4px rgba(67,160,71,.18); }
  .hero h1{ font-size:clamp(40px,6vw,60px); line-height:1.04; font-weight:700; letter-spacing:-.025em; color:${p.ink}; margin-bottom:22px; }
  .hero-sub{ font-size:19px; line-height:1.6; color:${p.body}; margin:0 0 34px; max-width:460px; }
  .hero-ctas{ display:flex; gap:14px; flex-wrap:wrap; align-items:center; }
  .stats{ display:flex; gap:34px; margin-top:46px; }
  .stat-num{ font-family:'${p.fontHead}',sans-serif; font-size:26px; font-weight:700; color:${p.ink}; }
  .stat-lbl{ font-size:13px; color:${p.muted}; }
  .stat-div{ width:1px; background:${p.border}; }
  .hero-media{ position:relative; }
  .hero-frame{ aspect-ratio:4/5; border-radius:28px; overflow:hidden; background:linear-gradient(135deg,${p.tint},${p.paperAlt}); box-shadow:0 40px 80px -40px rgba(40,60,50,.5); }
  .float-card{ position:absolute; background:#fff; border-radius:18px; padding:15px 19px; box-shadow:0 22px 46px -18px rgba(30,40,35,.45); display:flex; align-items:center; gap:13px; }
  .float-a{ left:-26px; bottom:42px; animation:floaty 5s ease-in-out infinite; }
  .float-b{ right:-16px; top:32px; animation:floaty 6s ease-in-out infinite; }
  .float-ico{ width:46px; height:46px; border-radius:50%; background:${p.primary}; display:flex; align-items:center; justify-content:center; flex:none; }

  /* Trust strip */
  .trust{ border-top:1px solid ${p.border}; border-bottom:1px solid ${p.border}; background:#fff; }
  .trust-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; padding:28px 32px; max-width:1200px; margin:0 auto; }
  .trust-item{ display:flex; align-items:center; gap:13px; }
  .trust-chip{ width:42px; height:42px; border-radius:12px; background:${p.tint}; display:flex; align-items:center; justify-content:center; flex:none; }
  .trust-t{ font-weight:700; font-size:15px; color:${p.ink}; }
  .trust-s{ font-size:13px; color:${p.muted}; }

  /* Section heads */
  .sec{ padding:86px 0 20px; }
  .sec-head{ text-align:center; max-width:640px; margin:0 auto 48px; }
  .sec-head h2{ font-size:clamp(30px,4vw,40px); font-weight:700; letter-spacing:-.02em; margin-top:14px; }

  /* Focus cards */
  .cards{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
  .card{ background:#fff; border:1px solid ${p.border}; border-radius:20px; padding:34px 30px; transition:transform .3s, box-shadow .3s; }
  .card:hover{ transform:translateY(-4px); box-shadow:0 26px 50px -28px rgba(30,40,35,.35); }
  .card-ico{ width:54px; height:54px; border-radius:15px; background:${p.primary}; display:flex; align-items:center; justify-content:center; margin-bottom:22px; }
  .card h3{ font-size:22px; font-weight:700; margin-bottom:10px; }
  .card p{ font-size:15px; line-height:1.65; color:${p.body}; margin:0 0 18px; }
  .card a{ color:${p.primary}; font-weight:600; font-size:15px; }

  /* Chips */
  .chips{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; padding-top:8px; }
  .chip{ display:flex; align-items:center; justify-content:space-between; background:${p.paperAlt}; border-radius:14px; padding:18px 22px; color:${p.ink}; font-weight:600; font-size:16px; transition:background .2s; }
  .chip:hover{ background:${p.tint}; }
  .chip span{ color:${p.primary}; }

  /* Philosophy */
  .phil{ display:grid; grid-template-columns:.9fr 1.1fr; gap:56px; align-items:center; padding:86px 0; }
  .phil-img{ aspect-ratio:1/1; overflow:hidden; background:linear-gradient(135deg,${p.tint},${p.paperAlt}); animation:blobPulse 12s ease-in-out infinite; }
  .phil h2{ font-size:clamp(28px,4vw,40px); font-weight:700; letter-spacing:-.02em; line-height:1.1; margin:14px 0 22px; }
  .phil p{ font-size:17px; line-height:1.7; color:${p.body}; margin:0 0 18px; }

  /* Gallery */
  .gal{ display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  .gal-item{ aspect-ratio:4/3; border-radius:18px; overflow:hidden; background:linear-gradient(135deg,${p.tint},${p.paperAlt}); }
  .gal-item img{ transition:transform .5s; }
  .gal-item:hover img{ transform:scale(1.05); }

  /* Dark band */
  .dark{ background:${p.deep}; color:${p.onDark}; margin-top:86px; }
  .dark-grid{ display:grid; grid-template-columns:1fr 1.15fr; gap:56px; padding:80px 32px; max-width:1200px; margin:0 auto; }
  .dark .eyebrow{ color:${p.onDarkMuted}; }
  .dark h2{ font-size:34px; font-weight:700; color:#fff; margin:14px 0 24px; }
  .open-badge{ display:inline-flex; align-items:center; gap:9px; background:${p.primary}28; color:${p.onDark}; font-size:14px; font-weight:600; padding:9px 16px; border-radius:999px; margin-bottom:24px; }
  .hours-row{ display:flex; justify-content:space-between; padding:13px 16px; border-radius:10px; }
  .hours-row.today{ background:${p.primary}26; }
  .hours-row span:last-child{ color:${p.onDark}; }
  .map-panel{ aspect-ratio:16/9; border-radius:16px; overflow:hidden; background:linear-gradient(135deg,${p.deepEnd},${p.primary}); display:flex; align-items:center; justify-content:center; margin-bottom:22px; position:relative; }
  .info-cards{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .info-card{ background:rgba(255,255,255,.05); border-radius:12px; padding:16px 18px; }
  .info-card .t{ font-weight:700; margin-bottom:6px; color:#fff; }
  .info-card .d{ font-size:14px; color:${p.onDarkMuted}; line-height:1.5; }

  /* Reviews */
  .rev-note{ text-align:center; font-size:13px; color:${p.muted}; margin:0 0 30px; font-style:italic; }
  .rev-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
  .rev-card{ background:#fff; border:1px solid ${p.border}; border-radius:18px; padding:28px; }
  .rev-stars{ color:${p.accent}; margin-bottom:14px; letter-spacing:2px; }
  .rev-card p{ font-size:16px; line-height:1.6; color:${p.body}; margin:0 0 20px; font-style:italic; }
  .rev-who{ display:flex; align-items:center; gap:11px; }
  .rev-av{ width:38px; height:38px; border-radius:50%; background:${p.tint}; color:${p.primary}; display:flex; align-items:center; justify-content:center; font-weight:700; }

  /* CTA band */
  .ctaband{ padding:0 32px; max-width:1200px; margin:86px auto; }
  .ctaband-inner{ background:linear-gradient(135deg,${p.primary},${p.deepEnd}); border-radius:28px; padding:64px 56px; display:flex; align-items:center; justify-content:space-between; gap:40px; flex-wrap:wrap; position:relative; overflow:hidden; }
  .ctaband-circle{ position:absolute; right:-60px; top:-60px; width:280px; height:280px; border-radius:50%; background:rgba(255,255,255,.05); }
  .ctaband h2{ font-size:clamp(30px,4vw,38px); font-weight:700; color:#fff; margin-bottom:12px; line-height:1.1; }
  .ctaband p{ font-size:18px; color:${p.onDark}; margin:0; max-width:440px; }

  /* Contact */
  .contact-grid{ display:grid; grid-template-columns:1fr 1.1fr; gap:56px; margin-top:48px; }
  .cdetail{ display:flex; align-items:flex-start; gap:16px; margin-bottom:24px; }
  .cdetail-ico{ width:46px; height:46px; border-radius:12px; background:${p.tint}; color:${p.primary}; display:flex; align-items:center; justify-content:center; flex:none; }
  .cdetail .l{ font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:${p.muted}; }
  .cdetail .v{ font-size:16px; font-weight:600; color:${p.ink}; margin-top:3px; }
  .cdetail .v a{ color:${p.ink}; }
  .form{ background:#fff; border:1px solid ${p.border}; border-radius:22px; padding:36px; }
  .form h3{ font-size:22px; font-weight:700; margin-bottom:24px; }
  .fg{ margin-bottom:16px; }
  .fg label{ display:block; font-size:13px; font-weight:600; color:${p.ink}; margin-bottom:7px; }
  .fg input, .fg textarea{ width:100%; padding:13px 15px; background:${p.paper}; border:1.5px solid ${p.border}; border-radius:11px; font-size:15px; font-family:inherit; color:${p.ink}; transition:border-color .2s, box-shadow .2s; }
  .fg input:focus, .fg textarea:focus{ outline:none; border-color:${p.primary}; box-shadow:0 0 0 3px ${p.primary}1f; }
  .fg textarea{ min-height:110px; resize:vertical; }
  .frow{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }

  /* Footer */
  footer{ background:${p.deep}; color:${p.onDarkMuted}; padding:64px 32px 36px; }
  .foot-grid{ display:grid; grid-template-columns:2fr 1fr 1fr; gap:56px; max-width:1200px; margin:0 auto 44px; }
  .foot-logo{ font-family:'${p.fontHead}',sans-serif; font-size:22px; font-weight:700; color:#fff; margin-bottom:12px; }
  .foot-blurb{ font-size:14px; line-height:1.6; max-width:280px; }
  .foot-col h4{ font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:${p.onDark}; margin:0 0 16px; }
  .foot-col a, .foot-col div{ display:block; font-size:14px; color:${p.onDarkMuted}; margin-bottom:10px; }
  .foot-col a:hover{ color:#fff; }
  .foot-bottom{ border-top:1px solid rgba(255,255,255,.1); padding-top:24px; max-width:1200px; margin:0 auto; font-size:13px; color:${p.onDarkMuted}; }

  @media(max-width:980px){
    .hero{ grid-template-columns:1fr; gap:40px; } .stats{ gap:24px; }
    .cards,.rev-grid,.gal{ grid-template-columns:1fr 1fr; }
    .phil,.dark-grid,.contact-grid,.foot-grid{ grid-template-columns:1fr; gap:36px; }
    .ctaband-inner{ padding:48px 36px; }
  }
  @media(max-width:768px){ .navlinks,.navphone{ display:none; } .burger{ display:flex; } }
  @media(max-width:720px){
    .wrap{ padding:0 20px; } .trust-grid{ grid-template-columns:1fr 1fr; }
    .cards,.rev-grid,.gal,.chips,.frow{ grid-template-columns:1fr; }
    .float-a,.float-b{ position:static; margin-top:14px; animation:none; display:inline-flex; }
  }
</style>
</head>
<body>

<div id="wlabs" onclick="this.remove()" title="${de ? "Ausblenden" : "Dismiss"}">✦ ${de ? "Konzept von WLABS" : "Concept by WLABS"}</div>

<div id="overlay">
  ${nav.map((n, i) => `<a href="${navHref[i]}" onclick="closeMenu()">${n}</a>`).join("\n  ")}
  <a href="#contact" class="navcta" style="font-size:18px; padding:15px 30px;" onclick="closeMenu()">${ctaLabel}</a>
</div>

<nav id="bar"><div class="navrow" id="top">
  <a href="#top" class="logo">
    <span class="logo-mark"><svg width="21" height="21" viewBox="0 0 24 24" fill="none"><path d="M12 2 4 5v6c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V5l-8-3Z" stroke="#fff" stroke-width="1.7" fill="none"/><path d="m9 12 2 2 4-4" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <span><span class="logo-name">${input.businessName}</span><br><span class="logo-sub">${label}${input.city ? ` · ${input.city}` : ""}</span></span>
  </a>
  <div class="navlinks">
    ${nav.map((n, i) => `<a href="${navHref[i]}"${i === 0 ? ' class="active"' : ""}>${n}</a>`).join("\n    ")}
  </div>
  <div style="display:flex; align-items:center; gap:18px;">
    ${phone ? `<a href="tel:${phone}" class="navphone"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1l-2.2 2.3Z" fill="${p.primary}"/></svg>${phone}</a>` : ""}
    <a href="#contact" class="navcta">${ctaLabel}</a>
    <button class="burger" onclick="openMenu()" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</div></nav>

<!-- HERO -->
<section class="wrap"><div class="hero">
  <div>
    <span class="status-pill"><span class="status-dot"></span>${de ? "Jetzt für neue Anfragen geöffnet" : "Open for new enquiries"}</span>
    <h1>${heroTitle}</h1>
    <p class="hero-sub">${heroSub}</p>
    <div class="hero-ctas">
      ${phone ? `<a href="tel:${phone}" class="btn btn-primary">${de ? "Jetzt anrufen" : "Call now"}</a>` : `<a href="#contact" class="btn btn-primary">${ctaLabel}</a>`}
      <a href="#services" class="btn btn-outline">${de ? "Unsere Leistungen" : "Our services"}</a>
    </div>
    <div class="stats">
      <div><div class="stat-num">${input.city ?? (de ? "Lokal" : "Local")}</div><div class="stat-lbl">${de ? "Vor Ort für Sie" : "In your area"}</div></div>
      <div class="stat-div"></div>
      <div><div class="stat-num">${de ? "Persönlich" : "Personal"}</div><div class="stat-lbl">${de ? "Direkter Kontakt" : "Direct contact"}</div></div>
      <div class="stat-div"></div>
      <div><div class="stat-num">${label}</div><div class="stat-lbl">${de ? "Ihr Fachbetrieb" : "Your specialist"}</div></div>
    </div>
  </div>
  <div class="hero-media">
    <div class="hero-frame">${img(input.heroImageUrl, input.businessName)}</div>
    <div class="float-card float-a">
      <span class="float-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <div><div style="font-size:14px; font-weight:700; color:${p.ink};">${de ? "Geprüfte Qualität" : "Trusted quality"}</div><div style="font-size:12px; color:${p.muted};">${de ? "Persönlich & lokal" : "Personal & local"}</div></div>
    </div>
    <div class="float-card float-b">
      <div><div style="font-size:14px; font-weight:700; color:${p.ink};">${de ? "Schnelle Antwort" : "Fast response"}</div><div style="font-size:12px; color:${p.muted};">${de ? "Innerhalb 24 Std." : "Within 24 hours"}</div></div>
    </div>
  </div>
</div></section>

<!-- TRUST STRIP -->
<section class="trust"><div class="trust-grid">
  ${[
    [de ? "Lizenziert" : "Licensed", de ? "& versichert" : "& insured", '<path d="M12 2 4 5v6c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V5l-8-3Z" stroke="STK" stroke-width="1.8" fill="none"/>'],
    [de ? "Kurze" : "Short", de ? "Wartezeiten" : "wait times", '<circle cx="12" cy="12" r="9" stroke="STK" stroke-width="1.8"/><path d="M12 7v5l3 2" stroke="STK" stroke-width="1.8" stroke-linecap="round"/>'],
    [de ? "Lokal" : "Local", input.city ?? (de ? "vor Ort" : "team"), '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" stroke="STK" stroke-width="1.8"/><circle cx="12" cy="10" r="2.5" stroke="STK" stroke-width="1.8"/>'],
    [de ? "Persönliche" : "Personal", de ? "Beratung" : "service", '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" stroke="STK" stroke-width="1.8" fill="none"/>'],
  ].map(([t, s, svg]) => `<div class="trust-item"><span class="trust-chip"><svg width="20" height="20" viewBox="0 0 24 24" fill="none">${svg.replace(/STK/g, p.primary)}</svg></span><div><div class="trust-t">${t}</div><div class="trust-s">${s}</div></div></div>`).join("\n  ")}
</div></section>

<!-- FOCUS -->
<section class="sec wrap reveal" id="services">
  <div class="sec-head">
    <span class="eyebrow">${de ? "Unsere Schwerpunkte" : "What we do"}</span>
    <h2>${de ? "Das gesamte Spektrum, persönlich für Sie" : "The full spectrum, made personal"}</h2>
  </div>
  <div class="cards">
    ${[
      [de ? "Kernleistung" : "Core service", de ? "Professionelle Beratung und Umsetzung für nachhaltige, sichtbare Ergebnisse." : "Expert advice and delivery focused on lasting, visible results.", '<path d="M12 2v20M2 12h20" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>'],
      [de ? "Maßgeschneidert" : "Tailored to you", de ? "Individuelle Lösungen, abgestimmt auf Ihre Wünsche und Ihr Budget." : "Individual solutions shaped around your goals and budget.", '<path d="M3 7h18M3 12h18M3 17h12" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>'],
      [de ? "Rundum-Service" : "End to end", de ? "Von der ersten Beratung bis zur Nachbetreuung — alles aus einer Hand." : "From first consultation to aftercare — all in one place.", '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/>'],
    ].map(([t, d, svg]) => `<div class="card"><span class="card-ico"><svg width="26" height="26" viewBox="0 0 24 24" fill="none">${svg}</svg></span><h3>${t}</h3><p>${d}</p><a href="#contact">${de ? "Mehr erfahren →" : "Learn more →"}</a></div>`).join("\n    ")}
  </div>
</section>

<!-- CHIPS -->
<section class="sec wrap reveal" style="padding-top:40px;">
  <div class="chips">
    ${chips.map((c) => `<a href="#contact" class="chip">${c} <span>→</span></a>`).join("\n    ")}
  </div>
</section>

<!-- PHILOSOPHY -->
<section class="wrap reveal" id="about"><div class="phil">
  <div class="phil-img">${img(input.philosophyImageUrl, de ? "Über uns" : "About us")}</div>
  <div>
    <span class="eyebrow">${de ? "Unsere Philosophie" : "Our philosophy"}</span>
    <h2>${de ? "Damit Sie gern und mit gutem Gefühl wiederkommen." : "So you leave glad you came — and happy to return."}</h2>
    <p>${de ? `Bei ${input.businessName} steht der Mensch im Mittelpunkt. Wir nehmen uns Zeit, hören zu und erklären verständlich — damit Sie sich von Anfang an gut aufgehoben fühlen.` : `At ${input.businessName}, people come first. We take the time to listen and explain things clearly — so you feel looked after from the very first moment.`}</p>
    <p>${de ? "Hochwertige Arbeit, faire Preise und ein Team, das Ihre Sprache spricht. Das ist unser Anspruch — jeden Tag aufs Neue." : "Quality work, fair pricing and a team that speaks your language. That's our standard — every single day."}</p>
    <a href="#contact" class="btn btn-outline" style="margin-top:8px;">${de ? "Lernen Sie uns kennen →" : "Get to know us →"}</a>
  </div>
</div></section>

<!-- GALLERY -->
<section class="sec wrap reveal" style="padding-top:20px;">
  <div class="sec-head">
    <span class="eyebrow">${de ? "Einblicke" : "A look inside"}</span>
    <h2>${de ? "Ein Eindruck von uns" : "A glimpse of our work"}</h2>
  </div>
  <div class="gal">
    ${gallery.slice(0, 3).map((g) => `<div class="gal-item">${img(g, input.businessName)}</div>`).join("\n    ")}
  </div>
</section>

<!-- HOURS + LOCATION (dark) -->
<section class="dark reveal"><div class="dark-grid">
  <div>
    <span class="eyebrow">${de ? "Öffnungszeiten" : "Opening hours"}</span>
    <h2>${de ? "Wann Sie uns erreichen" : "When to reach us"}</h2>
    <div class="open-badge"><span class="status-dot"></span>${de ? "Heute geöffnet" : "Open today"}</div>
    <div style="display:flex; flex-direction:column; gap:2px;">
      ${(de
        ? [["Montag – Donnerstag", "08:00 – 18:00", true], ["Freitag", "08:00 – 14:00", false], ["Samstag", de ? "Nach Vereinbarung" : "By appointment", false], ["Sonntag", de ? "Geschlossen" : "Closed", false]]
        : [["Monday – Thursday", "8:00 – 18:00", true], ["Friday", "8:00 – 14:00", false], ["Saturday", "By appointment", false], ["Sunday", "Closed", false]]
      ).map(([d, h, today]) => `<div class="hours-row${today ? " today" : ""}"><span style="font-weight:600; color:#fff;">${d}</span><span>${h}</span></div>`).join("\n      ")}
    </div>
  </div>
  <div>
    <span class="eyebrow">${de ? "So finden Sie uns" : "Find us"}</span>
    <h2>${input.city ?? (de ? "In Ihrer Nähe" : "Near you")}</h2>
    <div class="map-panel">
      ${addr
        ? `<iframe src="https://maps.google.com/maps?q=${encodeURIComponent(addr)}&output=embed&z=15" width="100%" height="100%" style="border:0;" loading="lazy" title="Map"></iframe>`
        : `<span style="color:#fff; display:flex; flex-direction:column; align-items:center; gap:8px;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" stroke="#fff" stroke-width="1.7"/><circle cx="12" cy="10" r="2.5" stroke="#fff" stroke-width="1.7"/></svg><span style="font-size:13px; letter-spacing:.1em;">${input.city ?? ""}</span></span>`}
    </div>
    <div class="info-cards">
      <div class="info-card"><div class="t">🚗 ${de ? "Anfahrt" : "By car"}</div><div class="d">${de ? "Gute Erreichbarkeit und Parkmöglichkeiten in der Nähe." : "Easy to reach with parking nearby."}</div></div>
      <div class="info-card"><div class="t">📞 ${de ? "Kontakt" : "Contact"}</div><div class="d">${phone ?? (de ? "Rufen Sie uns gerne an." : "Give us a call anytime.")}</div></div>
    </div>
  </div>
</div></section>

<!-- REVIEWS (honest placeholder) -->
<section class="sec wrap reveal">
  <div class="sec-head">
    <div class="rev-stars" style="font-size:22px; text-align:center;">★★★★★</div>
    <h2>${de ? "Was unsere Kundinnen und Kunden sagen" : "What our customers say"}</h2>
  </div>
  <p class="rev-note">${reviewNote}</p>
  <div class="rev-grid">
    ${sampleReviews.map((r, i) => `<div class="rev-card"><div class="rev-stars">★★★★★</div><p>"${r}"</p><div class="rev-who"><span class="rev-av">${["A", "M", "S"][i]}</span><div><div style="font-weight:700; font-size:14px; color:${p.ink};">${de ? "Kundin/Kunde" : "Customer"}</div><div style="font-size:13px; color:${p.muted};">${de ? "Beispiel" : "Sample"}</div></div></div></div>`).join("\n    ")}
  </div>
</section>

<!-- CTA BAND -->
<section class="ctaband reveal"><div class="ctaband-inner">
  <div class="ctaband-circle"></div>
  <div style="position:relative;">
    <h2>${de ? "Bereit, den nächsten Schritt zu gehen?" : "Ready to take the next step?"}</h2>
    <p>${de ? "Schreiben Sie uns oder rufen Sie an — wir freuen uns auf Sie." : "Send us a message or give us a call — we'd love to hear from you."}</p>
  </div>
  <div style="position:relative; display:flex; gap:14px; flex-wrap:wrap;">
    <a href="#contact" class="btn" style="background:#fff; color:${p.ink};">${ctaLabel}</a>
    ${phone ? `<a href="tel:${phone}" class="btn" style="border:1.5px solid rgba(255,255,255,.4); color:#fff;">${phone}</a>` : ""}
  </div>
</div></section>

<!-- CONTACT -->
<section class="sec wrap reveal" id="contact" style="padding-bottom:86px;">
  <div class="sec-head">
    <span class="eyebrow">${de ? "Kontakt" : "Contact"}</span>
    <h2>${de ? "Sprechen Sie uns an" : "Get in touch"}</h2>
  </div>
  <div class="contact-grid">
    <div>
      ${phone ? `<div class="cdetail"><span class="cdetail-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1l-2.2 2.3Z" fill="${p.primary}"/></svg></span><div><div class="l">${de ? "Telefon" : "Phone"}</div><div class="v"><a href="tel:${phone}">${phone}</a></div></div></div>` : ""}
      ${email ? `<div class="cdetail"><span class="cdetail-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="${p.primary}" stroke-width="1.8"/><path d="m3 7 9 6 9-6" stroke="${p.primary}" stroke-width="1.8"/></svg></span><div><div class="l">${de ? "E-Mail" : "Email"}</div><div class="v"><a href="mailto:${email}">${email}</a></div></div></div>` : ""}
      ${addr ? `<div class="cdetail"><span class="cdetail-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" stroke="${p.primary}" stroke-width="1.8"/><circle cx="12" cy="10" r="2.5" stroke="${p.primary}" stroke-width="1.8"/></svg></span><div><div class="l">${de ? "Adresse" : "Address"}</div><div class="v">${addr}</div></div></div>` : ""}
    </div>
    <div class="form">
      <h3>${de ? "Nachricht senden" : "Send a message"}</h3>
      <form action="#" onsubmit="return false">
        <div class="frow">
          <div class="fg"><label>${de ? "Name" : "Name"}</label><input type="text" placeholder="${de ? "Ihr Name" : "Your name"}"></div>
          <div class="fg"><label>${de ? "Telefon" : "Phone"}</label><input type="tel" placeholder="${de ? "Ihre Nummer" : "Your number"}"></div>
        </div>
        <div class="fg"><label>${de ? "E-Mail" : "Email"}</label><input type="email" placeholder="${de ? "ihre@email.de" : "you@email.com"}"></div>
        <div class="fg"><label>${de ? "Ihre Nachricht" : "Your message"}</label><textarea placeholder="${de ? "Wie können wir helfen?" : "How can we help?"}"></textarea></div>
        <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center;">${de ? "Absenden" : "Send message"} →</button>
      </form>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="foot-grid">
    <div>
      <div class="foot-logo">${input.businessName}</div>
      <div class="foot-blurb">${de ? `Ihr ${label}-Fachbetrieb${input.city ? ` in ${input.city}` : ""}. Persönlich, zuverlässig und immer für Sie da.` : `Your local ${label.toLowerCase()}${input.city ? ` in ${input.city}` : ""}. Personal, reliable and always here for you.`}</div>
    </div>
    <div class="foot-col"><h4>${de ? "Navigation" : "Navigation"}</h4>${nav.map((n, i) => `<a href="${navHref[i]}">${n}</a>`).join("")}</div>
    <div class="foot-col"><h4>${de ? "Kontakt" : "Contact"}</h4>${phone ? `<a href="tel:${phone}">${phone}</a>` : ""}${email ? `<a href="mailto:${email}">${email}</a>` : ""}${addr ? `<div>${addr}</div>` : input.city ? `<div>${input.city}</div>` : ""}</div>
  </div>
  <div class="foot-bottom">© ${year} ${input.businessName}. ${de ? "Alle Rechte vorbehalten." : "All rights reserved."} · ${de ? "Website-Konzept von" : "Website concept by"} WLABS</div>
</footer>

<script>
  var bar=document.getElementById('bar');
  addEventListener('scroll',function(){ bar.classList.toggle('scrolled', scrollY>12); },{passive:true});
  document.querySelectorAll('a[href^="#"]').forEach(function(a){ a.addEventListener('click',function(e){ var t=document.querySelector(a.getAttribute('href')); if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth',block:'start'}); } }); });
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('vis'); io.unobserve(e.target); } }); },{threshold:0.1, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  function openMenu(){ document.getElementById('overlay').classList.add('open'); }
  function closeMenu(){ document.getElementById('overlay').classList.remove('open'); }
</script>
</body>
</html>`;
}

export class WireframeGenerationAgent extends Agent<WireframeInput, WireframeOutput> {
  readonly name = "wireframe_generation_agent";
  readonly description = "Generates a self-contained interactive HTML wireframe for a prospect's redesigned website.";
  readonly inputSchema = inputSchema;
  readonly outputSchema = outputSchema;

  protected async execute(input: WireframeInput): Promise<WireframeOutput> {
    const aiHtml = await generateText({
      system: WIREFRAME_SYSTEM_PROMPT,
      prompt: buildWireframePrompt(input),
      temperature: 0.3,
      maxTokens: 16000,
      model: "claude-opus-4-8",
    });

    const wireframeHtml = aiHtml && aiHtml.includes("</html>") ? aiHtml : buildMockWireframe(input);
    return { wireframeHtml };
  }
}

export const wireframeGenerationAgent = new WireframeGenerationAgent();
