/**
 * Wireframe Generation Agent.
 *
 * Generates a self-contained interactive HTML wireframe for a prospect —
 * their first look at what their redesigned site could look like. Uses
 * the top-tier Opus model for maximum quality. Falls back to a structured
 * template in mock mode. Never invents testimonials, awards, or statistics.
 */
import { z } from "zod";

import { generateText } from "@/lib/ai/generate";
import { Agent } from "./base-agent";

const inputSchema = z.object({
  businessName: z.string(),
  industry: z.string(),
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
  imageUrls: z.array(z.string()).default([]),
  brandColors: z.array(z.string()).default([]),
  addressHint: z.string().nullable(),
  language: z.enum(["en", "de"]).default("en"),
});

const outputSchema = z.object({
  wireframeHtml: z.string().min(500),
});

export type WireframeInput = z.infer<typeof inputSchema>;
export type WireframeOutput = z.infer<typeof outputSchema>;

const WIREFRAME_SYSTEM_PROMPT = `You are an elite frontend developer and UI/UX designer at a premium web agency. Your task: generate a COMPLETE, self-contained interactive HTML wireframe that shows a prospect what their redesigned website could look like.

This is a high-stakes sales tool — it must be visually stunning, professional, and tailored to the specific business. The quality bar is an Awwwards Daily Award or CSS Design Awards finalist.

━━━ OUTPUT FORMAT ━━━
Return ONLY the raw HTML document. No markdown. No code fences. No explanation. Start with <!DOCTYPE html> and end with </html>.

━━━ TECHNICAL REQUIREMENTS ━━━
• Single file: ALL CSS inside <style> tags, ALL JS inside <script> tags
• External dependency allowed: Google Fonts only (via <link> in <head>)
• Sticky transparent nav → gains solid background + box-shadow on scroll (JS scroll listener toggling a CSS class)
• Hamburger menu toggle for mobile — slides in a full-overlay nav panel
• Scroll-reveal: IntersectionObserver adds .visible class to .reveal elements; CSS handles opacity/translateY animation
• Hover effects on cards: transform: translateY(-4px), box-shadow depth transition
• Smooth scroll for all anchor href="#section" links (scrollIntoView behavior: 'smooth')
• WLABS attribution: small fixed badge in bottom-right, non-obtrusive, dismissible via onclick

━━━ INDUSTRY DESIGN SYSTEMS ━━━
Choose the palette and typography that fits the industry. Adapt if brand colors are provided.

• Medical / Dental: Deep teal #1B6CA8 primary, clean white bg, DM Sans + DM Serif Display
• Physical therapy / Wellness: Forest green #2E7D32, warm white #FAFEF5, Lato + Merriweather
• Law / Professional services: Navy #1A237E, cream #FFFEF5, Cormorant Garamond + Inter
• Trades (plumber / electrician / construction): Trust blue #1565C0 or vivid orange #E65100, near-black bg for electrician, Barlow Condensed + Barlow
• Real estate / Premium: Deep violet #1A0533 or gunmetal, ivory, ultra-thin spacing, Raleway + Source Serif 4
• Restaurant / Food: Warm burgundy #7B1818 or terracotta, warm cream, Playfair Display + Lato
• Beauty / Aesthetic clinic: Rose #AD1457 on soft white #FFF8FB, Cormorant Garamond + Poppins
• Accounting / Finance: Professional green #1B5E20 or midnight blue, Source Sans 3
• General: Deep blue #1565C0 on white, Inter all weights

━━━ PAGE STRUCTURE ━━━
Build a single-page scrolling document with anchor navigation. For businesses with multi-page sites, simulate the full customer journey in sections. Include ALL of the following:

1. NAV — Fixed top: logo text (large, styled), 4–5 section anchor links, primary CTA button
2. HERO — Full-viewport height. If image URLs provided: use first as CSS background-image with dark overlay + parallax hint. If not: rich CSS gradient. Large display H1 (font-size: clamp(48px, 8vw, 96px)), 1–2 line subtext, two CTA buttons, trust tagline below
3. TRUST STRIP — Horizontal row of 3–4 credibility signals. Only state verifiable generic facts (licensed, insured, local, fast response) — NEVER invent specific numbers
4. SERVICES — 3–6 cards in responsive grid. If image URLs provided beyond hero: use for card backgrounds. Otherwise: styled gradient placeholder boxes (height: 160px). Card: image area, title, 1-line outcome-focused description, "→ Mehr erfahren" or "→ Learn more" link
5. HOW IT WORKS — Numbered process steps (3–4). Large outlined step number + title + description
6. ABOUT / WHY US — Business differentiators. Keep generic and honest if no specific data provided
7. CONTACT — Left: contact details (phone as <a href="tel:">, email as <a href="mailto:">, address if given, Google Maps embed if address given: <iframe src="https://maps.google.com/maps?q=ENCODED_ADDRESS&output=embed" loading="lazy">). Right: contact form skeleton (Name, Email/Phone, Message, Submit button — form action="#", no real submit needed)
8. FOOTER — Logo text, tagline, nav links, contact info, © YEAR businessName. All Rights Reserved.

━━━ ABSOLUTE RULES ━━━
1. NEVER invent testimonials, customer reviews, star ratings, or case studies with results
2. NEVER invent specific numbers ("500+ clients", "15 years experience") unless they appear verbatim in the provided website content
3. NEVER invent awards, certifications, or professional memberships
4. NEVER reference the audit score or WLABS analysis in the customer-facing wireframe content
5. Image URLs provided → embed as <img src="URL" loading="lazy" alt="..."> or CSS background-image
6. No images available → use gradient placeholder divs with aria-label describing the intended image
7. Contact form is visual skeleton only — no backend, just visual
8. Write all copy in the language specified (German or English). Use formal "Sie" for German.

━━━ RESPONSIVE ━━━
Mobile-first. Grid layouts collapse to 1 column below 640px. Font sizes use clamp(). Nav collapses to hamburger below 768px. Min touch target 44px for all buttons.`;

function buildWireframePrompt(input: WireframeInput): string {
  const images = input.imageUrls.slice(0, 8);
  const lang = input.language === "de" ? "German (formal Sie)" : "English";

  return `Generate a complete interactive HTML wireframe for this business. Language for all copy: ${lang}.

━━━ BUSINESS PROFILE ━━━
Business Name: ${input.businessName}
Industry: ${input.industry}
City: ${input.city ?? "Not specified"}
Country: ${input.country ?? "Not specified"}

━━━ CONTACT DETAILS ━━━
${input.contactPhone ? `Phone: ${input.contactPhone}` : "Phone: not available"}
${input.contactEmail ? `Email: ${input.contactEmail}` : "Email: not available"}
${input.websiteUrl ? `Current website: ${input.websiteUrl}` : ""}
${input.addressHint ? `Address: ${input.addressHint}` : "Address: not available"}

━━━ BRAND HINTS ━━━
${input.brandColors.length > 0 ? `Extracted brand colors (use as palette hints): ${input.brandColors.join(", ")}` : "No brand colors extracted — use industry-appropriate palette"}

━━━ EXISTING SITE CONTEXT ━━━
(Use to understand the business, NOT to copy content verbatim)
${input.extractedTitle ? `Page title: ${input.extractedTitle}` : ""}
${input.extractedH1 ? `Main heading: ${input.extractedH1}` : ""}
${input.extractedMetaDescription ? `Meta description: ${input.extractedMetaDescription}` : ""}
${input.extractedText ? `\nContent excerpt (first ~2000 chars):\n${input.extractedText.slice(0, 2000)}` : "No content extracted"}

━━━ CURRENT SITE PROBLEMS TO FIX ━━━
(Design the wireframe to address these — but don't mention them in the copy)
${input.topIssues.length > 0 ? input.topIssues.slice(0, 5).map((i) => `• ${i}`).join("\n") : "No audit data available"}
${input.criticalFindings.length > 0 ? "\nCritical findings:\n" + input.criticalFindings.slice(0, 3).map((f) => `• ${f}`).join("\n") : ""}

━━━ AVAILABLE IMAGE URLS ━━━
${images.length > 0 ? images.map((url, i) => `${i + 1}. ${url}`).join("\n") : "None — use CSS gradient placeholders throughout"}

Generate the complete HTML document now.`;
}

function buildMockWireframe(input: WireframeInput): string {
  const year = new Date().getFullYear();
  const de = input.language === "de";
  const city = input.city ?? (de ? "Ihrer Region" : "your area");
  const hasPhone = Boolean(input.contactPhone);
  const hasEmail = Boolean(input.contactEmail);
  const hasAddress = Boolean(input.addressHint);

  const heroHeadline = de
    ? `Professionelle Lösungen für ${input.city ?? "Ihre Region"}`
    : `Professional ${input.industry.replace(/_/g, " ")} services in ${city}`;
  const heroSub = de
    ? `${input.businessName} steht für Qualität, Zuverlässigkeit und persönlichen Service.`
    : `${input.businessName} delivers expert service tailored to your needs. Get in touch today.`;
  const ctaLabel = de ? "Jetzt anfragen" : "Get a free quote";
  const ctaAlt = de ? "Unsere Leistungen" : "View our services";

  const navLinks = de
    ? ["Leistungen", "Ablauf", "Über uns", "Kontakt"]
    : ["Services", "Process", "About", "Contact"];
  const navAnchors = ["#services", "#process", "#about", "#contact"];

  return `<!DOCTYPE html>
<html lang="${input.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${input.businessName} — ${de ? "Website-Konzept von WLABS" : "Website Concept by WLABS"}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --primary: #1565C0;
      --primary-dark: #0D47A1;
      --primary-light: #E3F2FD;
      --bg: #FAFAFA;
      --surface: #FFFFFF;
      --text: #0F172A;
      --muted: #64748B;
      --border: #E2E8F0;
      --radius: 14px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
      --shadow-lg: 0 10px 30px rgba(0,0,0,0.12);
    }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
    a { color: inherit; text-decoration: none; }
    img { display: block; max-width: 100%; }

    /* WLABS badge */
    #wlabs-badge {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      background: #0F172A; color: #fff; font-size: 11px; font-family: inherit;
      font-weight: 600; letter-spacing: 0.3px; padding: 10px 16px;
      border-radius: 24px; cursor: pointer; opacity: 0.92; transition: opacity 0.2s;
      box-shadow: 0 4px 16px rgba(0,0,0,0.24);
    }
    #wlabs-badge:hover { opacity: 1; }

    /* Nav */
    #main-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 200;
      padding: 20px 48px; display: flex; align-items: center; justify-content: space-between;
      transition: background 0.4s, box-shadow 0.4s, padding 0.3s;
    }
    #main-nav.scrolled {
      background: rgba(255,255,255,0.97); backdrop-filter: blur(12px);
      box-shadow: 0 1px 0 rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.04);
      padding: 14px 48px;
    }
    .nav-logo { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    #main-nav.scrolled .nav-logo { color: var(--text); }
    .nav-links { display: flex; align-items: center; gap: 8px; }
    .nav-links a {
      font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85);
      padding: 8px 14px; border-radius: 8px; transition: all 0.2s;
    }
    #main-nav.scrolled .nav-links a { color: var(--muted); }
    .nav-links a:hover { color: #fff; background: rgba(255,255,255,0.12); }
    #main-nav.scrolled .nav-links a:hover { color: var(--primary); background: var(--primary-light); }
    .nav-cta {
      background: var(--primary) !important; color: #fff !important;
      padding: 10px 20px !important; border-radius: 8px !important; font-weight: 600 !important;
      box-shadow: 0 2px 8px rgba(21,101,192,0.3);
    }
    .nav-cta:hover { background: var(--primary-dark) !important; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(21,101,192,0.4) !important; }
    .hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; border: none; background: none; }
    .hamburger span { width: 22px; height: 2px; background: #fff; border-radius: 2px; transition: all 0.3s; display: block; }
    #main-nav.scrolled .hamburger span { background: var(--text); }
    .mobile-overlay {
      display: none; position: fixed; inset: 0; background: rgba(15,23,42,0.96);
      z-index: 199; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
    }
    .mobile-overlay.open { display: flex; }
    .mobile-overlay a { font-size: 28px; font-weight: 700; color: #fff; padding: 12px; }
    .mobile-overlay .nav-cta { font-size: 18px !important; padding: 16px 32px !important; margin-top: 16px; background: var(--primary) !important; border-radius: 12px !important; }

    /* Hero */
    #hero {
      min-height: 100vh; display: flex; align-items: center; padding: 140px 48px 80px;
      background: linear-gradient(135deg, #1A237E 0%, #1565C0 45%, #0097A7 100%);
      position: relative; overflow: hidden;
    }
    #hero::before {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(ellipse at 70% 50%, rgba(0,151,167,0.25) 0%, transparent 60%);
    }
    .hero-inner { max-width: 1200px; margin: 0 auto; width: 100%; position: relative; }
    .hero-eyebrow {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.95); font-size: 12px; font-weight: 600;
      letter-spacing: 1.5px; text-transform: uppercase; padding: 8px 16px;
      border-radius: 24px; margin-bottom: 28px; backdrop-filter: blur(4px);
    }
    .hero-h1 {
      font-size: clamp(40px, 7vw, 84px); font-weight: 900; color: #fff;
      line-height: 1.02; letter-spacing: -2.5px; margin-bottom: 24px; max-width: 820px;
    }
    .hero-sub {
      font-size: clamp(16px, 2vw, 20px); color: rgba(255,255,255,0.75);
      margin-bottom: 44px; font-weight: 300; max-width: 560px; line-height: 1.65;
    }
    .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 70px; }
    .btn-primary {
      background: #fff; color: var(--primary); padding: 18px 36px; border-radius: 10px;
      font-weight: 700; font-size: 16px; cursor: pointer; transition: all 0.25s;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2); display: inline-block;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.28); }
    .btn-ghost {
      border: 2px solid rgba(255,255,255,0.45); color: #fff; padding: 16px 34px;
      border-radius: 10px; font-weight: 600; font-size: 16px; cursor: pointer;
      transition: all 0.25s; background: transparent; display: inline-block;
    }
    .btn-ghost:hover { border-color: #fff; background: rgba(255,255,255,0.12); }
    .hero-trust { font-size: 13px; color: rgba(255,255,255,0.55); display: flex; align-items: center; gap: 6px; }
    .hero-trust::before { content: '✓'; color: rgba(255,255,255,0.7); font-weight: 700; }

    /* Scroll reveal */
    .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1); }
    .reveal.visible { opacity: 1; transform: none; }

    /* Trust strip */
    #trust { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 48px; }
    .trust-inner {
      max-width: 1200px; margin: 0 auto;
      display: grid; grid-template-columns: repeat(4, 1fr);
      border-left: 1px solid var(--border);
    }
    .trust-item {
      display: flex; align-items: center; gap: 14px; padding: 28px 32px;
      border-right: 1px solid var(--border);
    }
    .trust-icon {
      width: 44px; height: 44px; border-radius: 10px; background: var(--primary-light);
      color: var(--primary); display: grid; place-items: center; flex-shrink: 0; font-size: 18px;
    }
    .trust-title { font-size: 13px; font-weight: 700; color: var(--text); }
    .trust-desc { font-size: 12px; color: var(--muted); margin-top: 2px; }

    /* Sections */
    .section { padding: 96px 48px; }
    .section-alt { background: var(--surface); }
    .section-inner { max-width: 1200px; margin: 0 auto; }
    .section-header { margin-bottom: 60px; }
    .section-eyebrow {
      font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;
      color: var(--primary); margin-bottom: 14px;
    }
    .section-title { font-size: clamp(28px, 4vw, 48px); font-weight: 800; color: var(--text); line-height: 1.1; letter-spacing: -1px; }
    .section-sub { font-size: 17px; color: var(--muted); line-height: 1.7; max-width: 580px; margin-top: 16px; }

    /* Cards */
    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .card {
      background: var(--surface); border-radius: var(--radius); overflow: hidden;
      box-shadow: var(--shadow-sm); border: 1px solid var(--border);
      transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s;
    }
    .card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
    .card-img {
      height: 180px; background: linear-gradient(135deg, var(--primary-light), #BBDEFB);
      display: flex; align-items: center; justify-content: center; color: #90CAF9;
      font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
    }
    .card-body { padding: 28px; }
    .card-title { font-size: 17px; font-weight: 700; margin-bottom: 8px; color: var(--text); }
    .card-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }
    .card-link { font-size: 13px; font-weight: 600; color: var(--primary); margin-top: 14px; display: inline-flex; align-items: center; gap: 4px; }

    /* Steps */
    .steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; }
    .step-num {
      font-size: 72px; font-weight: 900; color: var(--primary-light);
      line-height: 1; margin-bottom: 20px; font-variant-numeric: tabular-nums;
    }
    .step-title { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
    .step-desc { font-size: 14px; color: var(--muted); line-height: 1.65; }

    /* About */
    .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
    .about-img {
      height: 420px; background: linear-gradient(135deg, var(--primary-light), #C5CAE9);
      border-radius: 20px; display: flex; align-items: center; justify-content: center;
      color: #9FA8DA; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;
    }
    .differentiators { margin-top: 32px; display: flex; flex-direction: column; gap: 20px; }
    .diff-item { display: flex; gap: 16px; align-items: flex-start; }
    .diff-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--primary-light); color: var(--primary); display: grid; place-items: center; flex-shrink: 0; font-size: 16px; }
    .diff-title { font-size: 15px; font-weight: 700; color: var(--text); }
    .diff-desc { font-size: 13px; color: var(--muted); line-height: 1.5; margin-top: 3px; }

    /* Contact */
    #contact { background: #F0F4FF; }
    .contact-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 80px; margin-top: 60px; }
    .contact-detail { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 28px; }
    .contact-icon {
      width: 48px; height: 48px; border-radius: 12px; background: var(--primary);
      color: #fff; display: grid; place-items: center; flex-shrink: 0; font-size: 18px;
    }
    .contact-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); }
    .contact-val { font-size: 16px; font-weight: 600; color: var(--text); margin-top: 3px; }
    .map-placeholder { height: 200px; border-radius: 14px; background: linear-gradient(135deg, #DBEAFE, #C7D2FE); display: flex; align-items: center; justify-content: center; color: #7C3AED; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 28px; overflow: hidden; }
    .contact-form { background: var(--surface); border-radius: 20px; padding: 40px; box-shadow: var(--shadow-md); }
    .form-title { font-size: 22px; font-weight: 800; margin-bottom: 28px; color: var(--text); }
    .form-group { margin-bottom: 18px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%; padding: 13px 16px; border: 1.5px solid var(--border); border-radius: 10px;
      font-size: 15px; font-family: inherit; color: var(--text); background: var(--bg);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(21,101,192,0.1); }
    .form-group textarea { min-height: 110px; resize: vertical; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .btn-submit {
      width: 100%; background: var(--primary); color: #fff; padding: 16px; border-radius: 10px;
      font-size: 16px; font-weight: 700; cursor: pointer; border: none; font-family: inherit;
      transition: all 0.25s; margin-top: 8px;
    }
    .btn-submit:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(21,101,192,0.35); }

    /* Footer */
    footer { background: #0F172A; color: rgba(255,255,255,0.55); padding: 64px 48px 40px; }
    .footer-inner { max-width: 1200px; margin: 0 auto; }
    .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; margin-bottom: 48px; }
    .footer-logo { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; margin-bottom: 12px; }
    .footer-tagline { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.4); max-width: 280px; }
    .footer-col-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.7); margin-bottom: 18px; }
    .footer-col a { display: block; font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 10px; transition: color 0.2s; }
    .footer-col a:hover { color: #fff; }
    .footer-divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin-bottom: 28px; }
    .footer-copy { font-size: 13px; color: rgba(255,255,255,0.25); }

    /* Responsive */
    @media (max-width: 1024px) {
      .cards { grid-template-columns: repeat(2, 1fr); }
      .about-grid { grid-template-columns: 1fr; gap: 48px; }
      .footer-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 768px) {
      #main-nav { padding: 16px 20px; }
      #main-nav.scrolled { padding: 12px 20px; }
      .nav-links { display: none; }
      .hamburger { display: flex; }
      #hero { padding: 100px 20px 60px; }
      .hero-ctas { flex-direction: column; }
      .btn-primary, .btn-ghost { text-align: center; width: 100%; }
      .section { padding: 64px 20px; }
      .trust-inner { grid-template-columns: repeat(2, 1fr); border-left: none; }
      .trust-item { border: 1px solid var(--border); }
      #trust { padding: 0 20px; }
      .steps { grid-template-columns: 1fr; gap: 32px; }
      .contact-grid { grid-template-columns: 1fr; gap: 40px; }
      .form-row { grid-template-columns: 1fr; }
      footer { padding: 48px 20px 32px; }
      .footer-grid { grid-template-columns: 1fr; gap: 36px; }
    }
    @media (max-width: 640px) {
      .cards { grid-template-columns: 1fr; }
      .trust-inner { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

<div id="wlabs-badge" onclick="this.remove()" title="Dismiss">✦ ${de ? "Konzept von WLABS" : "Concept by WLABS"}</div>

<!-- Mobile overlay -->
<div class="mobile-overlay" id="mobile-menu">
  ${navLinks.map((label, i) => `<a href="${navAnchors[i]}" onclick="closeMobile()">${label}</a>`).join("\n  ")}
  <a href="#contact" class="nav-cta" onclick="closeMobile()">${ctaLabel}</a>
</div>

<!-- Nav -->
<nav id="main-nav">
  <div class="nav-logo">${input.businessName}</div>
  <div class="nav-links">
    ${navLinks.map((label, i) => `<a href="${navAnchors[i]}">${label}</a>`).join("\n    ")}
    <a href="#contact" class="nav-cta">${ctaLabel}</a>
  </div>
  <button class="hamburger" id="hamburger-btn" onclick="toggleMobile()" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</nav>

<!-- Hero -->
<section id="hero">
  <div class="hero-inner">
    <div class="hero-eyebrow">${input.industry.replace(/_/g, " ")}${input.city ? ` · ${input.city}` : ""}</div>
    <h1 class="hero-h1">${heroHeadline}</h1>
    <p class="hero-sub">${heroSub}</p>
    <div class="hero-ctas">
      ${hasPhone
        ? `<a href="tel:${input.contactPhone}" class="btn-primary">${de ? "Jetzt anrufen" : "Call now"}: ${input.contactPhone}</a>`
        : `<a href="#contact" class="btn-primary">${ctaLabel}</a>`}
      <a href="#services" class="btn-ghost">${ctaAlt}</a>
    </div>
    <p class="hero-trust">${de ? `Lokales Unternehmen in ${input.city ?? "Ihrer Region"} — persönlich & zuverlässig` : `Local ${input.city ?? "area"} business — personal service you can trust`}</p>
  </div>
</section>

<!-- Trust strip -->
<div id="trust">
  <div class="trust-inner">
    <div class="trust-item reveal">
      <div class="trust-icon">🛡</div>
      <div><div class="trust-title">${de ? "Lizenziert & versichert" : "Licensed & insured"}</div><div class="trust-desc">${de ? "Volles Vertrauen" : "Full peace of mind"}</div></div>
    </div>
    <div class="trust-item reveal" style="transition-delay:0.08s">
      <div class="trust-icon">📍</div>
      <div><div class="trust-title">${de ? `Lokal in ${input.city ?? "Ihrer Stadt"}` : `Local ${input.city ?? "area"} team`}</div><div class="trust-desc">${de ? "Kennen die Region" : "We know the area"}</div></div>
    </div>
    <div class="trust-item reveal" style="transition-delay:0.16s">
      <div class="trust-icon">⚡</div>
      <div><div class="trust-title">${de ? "Schnelle Reaktion" : "Fast response"}</div><div class="trust-desc">${de ? "Innerhalb von 24h" : "Within 24 hours"}</div></div>
    </div>
    <div class="trust-item reveal" style="transition-delay:0.24s">
      <div class="trust-icon">💬</div>
      <div><div class="trust-title">${de ? "Persönliche Beratung" : "Personal service"}</div><div class="trust-desc">${de ? "Direkt & transparent" : "Direct & transparent"}</div></div>
    </div>
  </div>
</div>

<!-- Services -->
<section class="section" id="services">
  <div class="section-inner">
    <div class="section-header reveal">
      <div class="section-eyebrow">${de ? "Leistungen" : "Services"}</div>
      <h2 class="section-title">${de ? "Was wir für Sie tun" : "What we offer"}</h2>
      <p class="section-sub">${de ? `${input.businessName} bietet ein breites Spektrum professioneller Leistungen — maßgeschneidert für Ihre Bedürfnisse.` : `${input.businessName} provides comprehensive professional services designed around your specific needs.`}</p>
    </div>
    <div class="cards">
      <div class="card reveal">
        <div class="card-img">[${de ? "Bild Leistung 1" : "Service image 1"}]</div>
        <div class="card-body">
          <div class="card-title">${de ? "Kernleistung 1" : "Core service 1"}</div>
          <div class="card-desc">${de ? "Professionelle Beratung und Umsetzung für nachhaltige Ergebnisse." : "Expert consultation and delivery focused on lasting results."}</div>
          <div class="card-link">${de ? "→ Mehr erfahren" : "→ Learn more"}</div>
        </div>
      </div>
      <div class="card reveal" style="transition-delay:0.1s">
        <div class="card-img">[${de ? "Bild Leistung 2" : "Service image 2"}]</div>
        <div class="card-body">
          <div class="card-title">${de ? "Kernleistung 2" : "Core service 2"}</div>
          <div class="card-desc">${de ? "Maßgeschneiderte Lösungen für Ihre individuellen Anforderungen." : "Tailored solutions designed around your unique requirements."}</div>
          <div class="card-link">${de ? "→ Mehr erfahren" : "→ Learn more"}</div>
        </div>
      </div>
      <div class="card reveal" style="transition-delay:0.2s">
        <div class="card-img">[${de ? "Bild Leistung 3" : "Service image 3"}]</div>
        <div class="card-body">
          <div class="card-title">${de ? "Kernleistung 3" : "Core service 3"}</div>
          <div class="card-desc">${de ? "Zuverlässige Unterstützung und langfristiger Service." : "Reliable support and long-term partnership."}</div>
          <div class="card-link">${de ? "→ Mehr erfahren" : "→ Learn more"}</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Process -->
<section class="section section-alt" id="process">
  <div class="section-inner">
    <div class="section-header reveal">
      <div class="section-eyebrow">${de ? "So arbeiten wir" : "How it works"}</div>
      <h2 class="section-title">${de ? "Einfach & transparent" : "Simple & transparent"}</h2>
    </div>
    <div class="steps">
      <div class="step reveal">
        <div class="step-num">01</div>
        <div class="step-title">${de ? "Erstgespräch" : "Initial consultation"}</div>
        <div class="step-desc">${de ? "Wir besprechen Ihre Anforderungen und finden die optimale Lösung für Ihr Anliegen." : "We discuss your needs and identify the optimal solution for your situation."}</div>
      </div>
      <div class="step reveal" style="transition-delay:0.1s">
        <div class="step-num">02</div>
        <div class="step-title">${de ? "Angebot & Planung" : "Proposal & planning"}</div>
        <div class="step-desc">${de ? "Transparentes Angebot auf Basis Ihrer Bedürfnisse — keine versteckten Kosten." : "Clear proposal based on your needs — no hidden costs or surprises."}</div>
      </div>
      <div class="step reveal" style="transition-delay:0.2s">
        <div class="step-num">03</div>
        <div class="step-title">${de ? "Professionelle Umsetzung" : "Professional delivery"}</div>
        <div class="step-desc">${de ? "Pünktliche und qualitativ hochwertige Umsetzung nach Ihren Vorgaben." : "Timely, high-quality delivery aligned with your specifications."}</div>
      </div>
      <div class="step reveal" style="transition-delay:0.3s">
        <div class="step-num">04</div>
        <div class="step-title">${de ? "Nachbetreuung" : "Aftercare"}</div>
        <div class="step-desc">${de ? "Auch nach Abschluss stehen wir für Fragen und Anpassungen zur Verfügung." : "We remain available for questions and adjustments long after delivery."}</div>
      </div>
    </div>
  </div>
</section>

<!-- About -->
<section class="section" id="about">
  <div class="section-inner">
    <div class="about-grid">
      <div class="about-img reveal">[${de ? "Bild — Team / Arbeitsplatz" : "Image — team / workspace"}]</div>
      <div>
        <div class="section-header reveal">
          <div class="section-eyebrow">${de ? "Über uns" : "About us"}</div>
          <h2 class="section-title">${de ? `Warum ${input.businessName}?` : `Why ${input.businessName}?`}</h2>
          <p class="section-sub">${de ? `${input.businessName} steht für Qualität, Verlässlichkeit und persönliche Betreuung${input.city ? ` in ${input.city}` : ""}. Wir kennen die lokalen Bedürfnisse und sprechen Ihre Sprache.` : `${input.businessName} stands for quality, reliability and personal attention${input.city ? ` in ${input.city}` : ""}. We understand local needs and speak your language.`}</p>
        </div>
        <div class="differentiators reveal">
          <div class="diff-item">
            <div class="diff-icon">✓</div>
            <div><div class="diff-title">${de ? "Lokal verwurzelt" : "Locally rooted"}</div><div class="diff-desc">${de ? `Wir sind Teil der Gemeinschaft in ${input.city ?? "Ihrer Region"}.` : `We're part of the ${input.city ?? "local"} community.`}</div></div>
          </div>
          <div class="diff-item">
            <div class="diff-icon">✓</div>
            <div><div class="diff-title">${de ? "Persönlicher Ansprechpartner" : "Dedicated point of contact"}</div><div class="diff-desc">${de ? "Sie erreichen uns direkt — kein Callcenter." : "Reach us directly — no call centres or queues."}</div></div>
          </div>
          <div class="diff-item">
            <div class="diff-icon">✓</div>
            <div><div class="diff-title">${de ? "Transparente Preise" : "Transparent pricing"}</div><div class="diff-desc">${de ? "Klare Angebote ohne versteckte Kosten." : "Clear quotes with no hidden fees."}</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section class="section" id="contact">
  <div class="section-inner">
    <div class="section-header reveal">
      <div class="section-eyebrow">${de ? "Kontakt" : "Contact"}</div>
      <h2 class="section-title">${de ? "Sprechen Sie uns an" : "Get in touch"}</h2>
      <p class="section-sub">${de ? "Wir freuen uns auf Ihre Anfrage und melden uns innerhalb eines Werktages." : "We'd love to hear from you. We typically respond within one business day."}</p>
    </div>
    <div class="contact-grid">
      <div class="reveal">
        ${hasPhone ? `<div class="contact-detail"><div class="contact-icon">📞</div><div><div class="contact-label">${de ? "Telefon" : "Phone"}</div><div class="contact-val"><a href="tel:${input.contactPhone}">${input.contactPhone}</a></div></div></div>` : ""}
        ${hasEmail ? `<div class="contact-detail"><div class="contact-icon">✉</div><div><div class="contact-label">${de ? "E-Mail" : "Email"}</div><div class="contact-val"><a href="mailto:${input.contactEmail}">${input.contactEmail}</a></div></div></div>` : ""}
        ${hasAddress ? `<div class="contact-detail"><div class="contact-icon">📍</div><div><div class="contact-label">${de ? "Adresse" : "Address"}</div><div class="contact-val">${input.addressHint}</div></div></div>` : ""}
        ${hasAddress
          ? `<div class="map-placeholder"><iframe src="https://maps.google.com/maps?q=${encodeURIComponent(input.addressHint ?? "")}&output=embed" width="100%" height="200" frameborder="0" style="border:0;border-radius:14px" loading="lazy" title="Map"></iframe></div>`
          : `<div class="map-placeholder">[${de ? "Standort-Karte" : "Location map"}]</div>`}
      </div>
      <div class="contact-form reveal" style="transition-delay:0.15s">
        <div class="form-title">${de ? "Kostenlose Anfrage" : "Free enquiry"}</div>
        <form action="#" onsubmit="return false">
          <div class="form-row">
            <div class="form-group"><label>${de ? "Vorname" : "First name"}</label><input type="text" placeholder="${de ? "Max" : "John"}"></div>
            <div class="form-group"><label>${de ? "Nachname" : "Last name"}</label><input type="text" placeholder="${de ? "Mustermann" : "Smith"}"></div>
          </div>
          <div class="form-group"><label>${de ? "E-Mail oder Telefon" : "Email or phone"}</label><input type="text" placeholder="${de ? "max@beispiel.de" : "you@example.com"}"></div>
          <div class="form-group"><label>${de ? "Ihre Nachricht" : "Your message"}</label><textarea placeholder="${de ? "Wie können wir Ihnen helfen?" : "How can we help you?"}"></textarea></div>
          <button class="btn-submit" type="submit">${de ? "Nachricht senden" : "Send message"} →</button>
        </form>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer>
  <div class="footer-inner">
    <div class="footer-grid">
      <div>
        <div class="footer-logo">${input.businessName}</div>
        <div class="footer-tagline">${de ? `Ihr lokaler Experte${input.city ? ` in ${input.city}` : ""} für professionelle Lösungen.` : `Your local${input.city ? ` ${input.city}` : ""} expert for professional solutions.`}</div>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">${de ? "Navigation" : "Navigation"}</div>
        ${navLinks.map((label, i) => `<a href="${navAnchors[i]}">${label}</a>`).join("\n        ")}
      </div>
      <div class="footer-col">
        <div class="footer-col-title">${de ? "Kontakt" : "Contact"}</div>
        ${hasPhone ? `<a href="tel:${input.contactPhone}">${input.contactPhone}</a>` : ""}
        ${hasEmail ? `<a href="mailto:${input.contactEmail}">${input.contactEmail}</a>` : ""}
        ${input.city ? `<a href="#contact">${input.city}${input.country ? `, ${input.country}` : ""}</a>` : ""}
      </div>
    </div>
    <hr class="footer-divider">
    <div class="footer-copy">© ${year} ${input.businessName}. ${de ? "Alle Rechte vorbehalten." : "All rights reserved."} · ${de ? "Website-Konzept von" : "Website concept by"} WLABS</div>
  </div>
</footer>

<script>
  // Sticky nav
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => { nav.classList.toggle('scrolled', window.scrollY > 60); }, { passive: true });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  // Scroll reveal
  const revealObs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  // Mobile menu
  function toggleMobile() {
    document.getElementById('mobile-menu').classList.toggle('open');
  }
  function closeMobile() {
    document.getElementById('mobile-menu').classList.remove('open');
  }
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
      temperature: 0.25,
      maxTokens: 16000,
      model: "claude-opus-4-8",
    });

    const wireframeHtml = aiHtml ?? buildMockWireframe(input);
    return { wireframeHtml };
  }
}

export const wireframeGenerationAgent = new WireframeGenerationAgent();
