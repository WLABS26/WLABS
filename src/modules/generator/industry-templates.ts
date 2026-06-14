/**
 * Industry Template configuration.
 *
 * Each accepted industry gets a configurable template that drives tone, visual
 * style, default sections, conversion priorities, CTAs, and neutral trust
 * elements. The Redesign Strategy and Preview Generation agents use these as a
 * starting point and then personalise with the audited business's own details.
 *
 * Trust elements here are deliberately NEUTRAL placeholders (no invented
 * reviews, awards, or certifications) - real proof is only added when the
 * crawler actually found it.
 */
import { INDUSTRIES } from "@/modules/shared/constants";
import type { IndustryKey } from "@/modules/shared/types";

export type VisualStyle = "modern" | "warm" | "bold" | "clinical" | "premium";

export interface IndustryTemplate {
  key: IndustryKey;
  label: string;
  tone: string;
  visualStyle: VisualStyle;
  theme: { from: string; to: string };
  /** Headline templates - {business} and {city} are substituted at generation time. */
  headlineTemplates: string[];
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  trustCue: string;
  problemPoints: string[];
  services: { title: string; description: string }[];
  whyUs: { title: string; description: string }[];
  /** Neutral trust placeholders - safe to show without real proof. */
  trustElements: string[];
  conversionPriorities: string[];
  localAngle: string;
}

const BRAND = { blue: "#2563EB", cyan: "#06B6D4", purple: "#8B5CF6" };

const TEMPLATES: Record<string, IndustryTemplate> = {
  dentist: {
    key: "dentist",
    label: "Dentist",
    tone: "Calm, reassuring, and professional - reduces anxiety and builds trust.",
    visualStyle: "clinical",
    theme: { from: "#0EA5E9", to: "#22D3EE" },
    headlineTemplates: ["Your trusted family dentist in {city}", "Gentle, modern dental care for {city}"],
    subheadline: "Modern dental care with easy online booking and a gentle, patient-first approach.",
    primaryCta: "Book an appointment",
    secondaryCta: "View our services",
    trustCue: "Trusted by local families",
    problemPoints: [
      "Hard to book an appointment online",
      "Hidden or unclear pricing",
      "Dated site that doesn't feel hygienic or modern",
    ],
    services: [
      { title: "General Dentistry", description: "Check-ups, hygiene, and preventative care for the whole family." },
      { title: "Cosmetic Dentistry", description: "Whitening, veneers, and smile makeovers." },
      { title: "Emergency Care", description: "Same-day appointments when you need them most." },
    ],
    whyUs: [
      { title: "Gentle approach", description: "A calm, anxiety-free experience for nervous patients." },
      { title: "Easy booking", description: "Book online in seconds, any time of day." },
      { title: "Modern equipment", description: "Up-to-date technology for comfortable, precise care." },
    ],
    trustElements: ["Serving local families", "Easy online booking", "Friendly, qualified team"],
    conversionPriorities: ["Online booking CTA", "Visible phone number", "Service clarity"],
    localAngle: "Rank for 'dentist in {city}' with clear location and opening hours.",
  },
  physiotherapist: {
    key: "physiotherapist",
    label: "Physiotherapist",
    tone: "Friendly, encouraging, recovery-focused.",
    visualStyle: "warm",
    theme: { from: "#0D9488", to: "#34D399" },
    headlineTemplates: ["Get back to doing what you love, {city}", "Expert physiotherapy in {city}"],
    subheadline: "Personalised treatment plans to relieve pain and restore movement - book online today.",
    primaryCta: "Book a session",
    secondaryCta: "See how we help",
    trustCue: "Helping the local community move better",
    problemPoints: ["No online booking", "Unclear treatment options", "Hard to find contact details"],
    services: [
      { title: "Sports Injury", description: "Assessment and rehab to get you back to training." },
      { title: "Back & Neck Pain", description: "Hands-on treatment and tailored exercise plans." },
      { title: "Post-Surgery Rehab", description: "Guided recovery to restore strength and mobility." },
    ],
    whyUs: [
      { title: "Tailored plans", description: "Treatment built around your goals and lifestyle." },
      { title: "Hands-on care", description: "Experienced therapists who take the time to listen." },
      { title: "Flexible hours", description: "Early and late appointments to fit your schedule." },
    ],
    trustElements: ["Personalised treatment plans", "Convenient appointment times", "Experienced therapists"],
    conversionPriorities: ["Booking CTA", "Service area", "Treatment clarity"],
    localAngle: "Target 'physiotherapy near me' with strong location signals.",
  },
  plumber: {
    key: "plumber",
    label: "Plumber",
    tone: "Direct, dependable, urgency-aware.",
    visualStyle: "bold",
    theme: { from: BRAND.blue, to: "#0EA5E9" },
    headlineTemplates: ["Fast, reliable plumbing in {city}", "{city}'s trusted local plumber"],
    subheadline: "From emergency repairs to installations - fast call-outs and fair, upfront pricing.",
    primaryCta: "Call now",
    secondaryCta: "Request a quote",
    trustCue: "Fast response, fair pricing",
    problemPoints: ["No tap-to-call number", "No visible service area", "Slow, hard-to-use on mobile"],
    services: [
      { title: "Emergency Repairs", description: "Burst pipes, leaks, and blockages - fast." },
      { title: "Boiler & Heating", description: "Installation, servicing, and repairs." },
      { title: "Bathrooms", description: "Full installations and upgrades." },
    ],
    whyUs: [
      { title: "Rapid response", description: "Quick call-outs when you need help fast." },
      { title: "Upfront pricing", description: "Clear quotes with no surprise charges." },
      { title: "Local & reliable", description: "A name your neighbours trust." },
    ],
    trustElements: ["Fast call-outs", "Upfront pricing", "Serving the local area"],
    conversionPriorities: ["Click-to-call", "Service area map", "Emergency CTA"],
    localAngle: "Capture 'emergency plumber {city}' searches with prominent phone CTA.",
  },
  electrician: {
    key: "electrician",
    label: "Electrician",
    tone: "Trustworthy, safety-first, professional.",
    visualStyle: "bold",
    theme: { from: "#F59E0B", to: BRAND.blue },
    headlineTemplates: ["Certified electricians in {city}", "Safe, reliable electrical work in {city}"],
    subheadline: "Qualified electricians for homes and businesses - safe, certified, and on time.",
    primaryCta: "Get a free quote",
    secondaryCta: "Our services",
    trustCue: "Qualified and fully insured",
    problemPoints: ["No trust signals near contact", "Confusing mobile menu", "Unclear what services are offered"],
    services: [
      { title: "Rewiring", description: "Full and partial rewiring for older properties." },
      { title: "Fault Finding", description: "Fast diagnosis and safe repairs." },
      { title: "EV Chargers", description: "Home and business charger installation." },
    ],
    whyUs: [
      { title: "Fully qualified", description: "Certified, insured, and up to standard." },
      { title: "Tidy workmanship", description: "Clean, careful work in your home or premises." },
      { title: "Clear quotes", description: "Transparent pricing before we start." },
    ],
    trustElements: ["Qualified & insured", "Free quotes", "Domestic & commercial"],
    conversionPriorities: ["Trust badges near CTA", "Quote request", "Service clarity"],
    localAngle: "Rank for 'electrician {city}' with credentials front and centre.",
  },
  lawyer: {
    key: "lawyer",
    label: "Lawyer",
    tone: "Authoritative, credible, confidence-building.",
    visualStyle: "premium",
    theme: { from: "#1E3A8A", to: BRAND.purple },
    headlineTemplates: ["Trusted legal advice in {city}", "Clear, confident legal support in {city}"],
    subheadline: "Practical legal expertise for individuals and businesses - book a confidential consultation.",
    primaryCta: "Book a consultation",
    secondaryCta: "Our practice areas",
    trustCue: "Confidential, professional advice",
    problemPoints: ["Dense, hard-to-scan text", "Consultation CTA buried", "Dated design undermines authority"],
    services: [
      { title: "Family Law", description: "Sensitive, practical advice when it matters most." },
      { title: "Conveyancing", description: "Smooth, transparent property transactions." },
      { title: "Business Law", description: "Contracts, disputes, and commercial advice." },
    ],
    whyUs: [
      { title: "Clear advice", description: "Plain-English guidance, no jargon." },
      { title: "Responsive", description: "We keep you informed at every step." },
      { title: "Experienced", description: "A team you can rely on." },
    ],
    trustElements: ["Confidential consultations", "Clear fixed-fee options", "Experienced team"],
    conversionPriorities: ["Consultation CTA", "Practice-area clarity", "Credibility"],
    localAngle: "Target 'solicitor {city}' with authority and clear practice areas.",
  },
  accountant: {
    key: "accountant",
    label: "Accountant",
    tone: "Precise, reassuring, business-savvy.",
    visualStyle: "premium",
    theme: { from: "#047857", to: BRAND.blue },
    headlineTemplates: ["Accounting that grows your business in {city}", "Stress-free accounting in {city}"],
    subheadline: "From bookkeeping to tax planning - clear advice that keeps your finances on track.",
    primaryCta: "Book a free call",
    secondaryCta: "Our services",
    trustCue: "Trusted by local businesses",
    problemPoints: ["Vague service descriptions", "No clear next step", "Outdated, low-trust design"],
    services: [
      { title: "Tax & Self-Assessment", description: "Stay compliant and pay only what you owe." },
      { title: "Bookkeeping", description: "Accurate records, painlessly managed." },
      { title: "Business Advisory", description: "Practical advice to help you grow." },
    ],
    whyUs: [
      { title: "Proactive advice", description: "We spot opportunities before you ask." },
      { title: "Fixed fees", description: "No surprise bills, ever." },
      { title: "Always available", description: "A real person who knows your business." },
    ],
    trustElements: ["Fixed monthly fees", "Cloud accounting", "Friendly local team"],
    conversionPriorities: ["Free consultation CTA", "Service clarity", "Trust"],
    localAngle: "Rank for 'accountant {city}' for small businesses and sole traders.",
  },
  real_estate: {
    key: "real_estate",
    label: "Real Estate Agency",
    tone: "Confident, local, results-driven.",
    visualStyle: "modern",
    theme: { from: BRAND.blue, to: BRAND.purple },
    headlineTemplates: ["Sell your home faster in {city}", "Your local property experts in {city}"],
    subheadline: "Local market expertise and modern marketing to get you the best result.",
    primaryCta: "Book a free valuation",
    secondaryCta: "View listings",
    trustCue: "Local market specialists",
    problemPoints: ["No clear valuation CTA", "Listings hard to browse on mobile", "Generic, low-trust design"],
    services: [
      { title: "Sales", description: "Expert marketing to sell for the best price." },
      { title: "Lettings", description: "Hassle-free management for landlords." },
      { title: "Valuations", description: "Accurate, no-obligation property valuations." },
    ],
    whyUs: [
      { title: "Local knowledge", description: "We know your area inside out." },
      { title: "Modern marketing", description: "Professional photos and wide reach." },
      { title: "Personal service", description: "One point of contact, start to finish." },
    ],
    trustElements: ["Free valuations", "Local market knowledge", "Modern marketing"],
    conversionPriorities: ["Valuation CTA", "Listings access", "Local credibility"],
    localAngle: "Capture 'estate agent {city}' and 'house valuation {city}' searches.",
  },
  restaurant: {
    key: "restaurant",
    label: "Restaurant / Café",
    tone: "Warm, appetising, inviting.",
    visualStyle: "warm",
    theme: { from: "#DC2626", to: "#F59E0B" },
    headlineTemplates: ["Fresh, local dining in {city}", "Your favourite table in {city}"],
    subheadline: "Seasonal menus, a warm welcome, and easy online reservations.",
    primaryCta: "Reserve a table",
    secondaryCta: "View the menu",
    trustCue: "A local favourite",
    problemPoints: ["Menu hidden in a PDF", "No online reservations", "Low-quality photos"],
    services: [
      { title: "Dine In", description: "A warm, welcoming space for every occasion." },
      { title: "Takeaway", description: "Your favourites, ready to collect." },
      { title: "Private Events", description: "Celebrations and gatherings catered for." },
    ],
    whyUs: [
      { title: "Fresh & local", description: "Seasonal ingredients, made with care." },
      { title: "Warm welcome", description: "Friendly service every time." },
      { title: "Easy booking", description: "Reserve your table in seconds." },
    ],
    trustElements: ["Seasonal menu", "Easy reservations", "Warm atmosphere"],
    conversionPriorities: ["Reservation CTA", "Visible menu", "Appetising imagery"],
    localAngle: "Target 'restaurants in {city}' with menu and booking front and centre.",
  },
  beauty_clinic: {
    key: "beauty_clinic",
    label: "Beauty / Aesthetics Clinic",
    tone: "Elegant, aspirational, reassuring.",
    visualStyle: "premium",
    theme: { from: "#DB2777", to: BRAND.purple },
    headlineTemplates: ["Look and feel your best in {city}", "Premium beauty treatments in {city}"],
    subheadline: "Expert treatments in a relaxing setting - book online and see our price list.",
    primaryCta: "Book a treatment",
    secondaryCta: "View treatments & prices",
    trustCue: "Trusted, professional care",
    problemPoints: ["No online booking", "Prices not listed", "Slow image gallery on mobile"],
    services: [
      { title: "Skin Treatments", description: "Facials and skincare tailored to you." },
      { title: "Aesthetics", description: "Safe, professional advanced treatments." },
      { title: "Brows & Lashes", description: "Enhancements for a natural, polished look." },
    ],
    whyUs: [
      { title: "Expert team", description: "Qualified, experienced practitioners." },
      { title: "Relaxing space", description: "A calm, welcoming environment." },
      { title: "Clear pricing", description: "Transparent prices, no surprises." },
    ],
    trustElements: ["Qualified practitioners", "Transparent pricing", "Relaxing environment"],
    conversionPriorities: ["Booking CTA", "Price list", "Gallery"],
    localAngle: "Rank for 'beauty clinic {city}' with bookings and prices visible.",
  },
  construction: {
    key: "construction",
    label: "Construction / Trades",
    tone: "Solid, reliable, results-focused.",
    visualStyle: "bold",
    theme: { from: "#B45309", to: "#1F2937" },
    headlineTemplates: ["Quality building work in {city}", "{city}'s reliable construction partner"],
    subheadline: "From extensions to renovations - quality workmanship and clear, honest quotes.",
    primaryCta: "Request a quote",
    secondaryCta: "See our work",
    trustCue: "Quality you can count on",
    problemPoints: ["Project gallery lacks context", "No clear quote pathway", "Feature-led, not outcome-led copy"],
    services: [
      { title: "Extensions", description: "Add space and value to your home." },
      { title: "Renovations", description: "Full refurbishments, done properly." },
      { title: "New Builds", description: "From foundations to finish." },
    ],
    whyUs: [
      { title: "Quality work", description: "Craftsmanship that lasts." },
      { title: "On time, on budget", description: "Clear timelines and honest quotes." },
      { title: "Fully insured", description: "Peace of mind on every project." },
    ],
    trustElements: ["Free quotes", "Fully insured", "Portfolio of work"],
    conversionPriorities: ["Quote CTA", "Project gallery", "Trust"],
    localAngle: "Target 'builders {city}' with a strong portfolio and quote CTA.",
  },
  other: {
    key: "other",
    label: "Local Business",
    tone: "Professional, clear, customer-focused.",
    visualStyle: "modern",
    theme: { from: BRAND.blue, to: BRAND.cyan },
    headlineTemplates: ["A modern website for {business}", "{business} - serving {city}"],
    subheadline: "A clear, modern homepage that helps local customers find and contact you.",
    primaryCta: "Get in touch",
    secondaryCta: "Learn more",
    trustCue: "Serving local customers",
    problemPoints: ["Unclear messaging", "Hard to contact", "Not optimised for mobile"],
    services: [
      { title: "Our Services", description: "Clear, benefit-led descriptions of what you offer." },
      { title: "Quality First", description: "A focus on doing right by every customer." },
      { title: "Local & Trusted", description: "Proud to serve the local community." },
    ],
    whyUs: [
      { title: "Customer-focused", description: "We put your needs first." },
      { title: "Reliable", description: "Dependable service, every time." },
      { title: "Local", description: "Part of the community you serve." },
    ],
    trustElements: ["Serving local customers", "Friendly service", "Easy to contact"],
    conversionPriorities: ["Contact CTA", "Service clarity", "Local signals"],
    localAngle: "Strengthen local search visibility with clear location signals.",
  },
};

const INDUSTRY_LABELS = new Map<string, string>(INDUSTRIES.map((i) => [i.value, i.label]));

/** Select the industry template for a lead, falling back to the generic 'other' template. */
export function selectIndustryTemplate(industry: string): IndustryTemplate {
  return TEMPLATES[industry] ?? TEMPLATES.other;
}

export function industryLabel(industry: string): string {
  return INDUSTRY_LABELS.get(industry) ?? "Local Business";
}

export { TEMPLATES as INDUSTRY_TEMPLATES };
