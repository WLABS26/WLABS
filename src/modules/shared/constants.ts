/**
 * WLABS shared constants.
 * Single source of truth for brand info, navigation, pricing, industries,
 * and the standardized 100-point audit rubric used across the app.
 */

export const BRAND = {
  name: "WLABS",
  fullName: "Website Laboratory",
  tagline: "We analyze. We design. We elevate.",
  supportingLine: "Modern websites, engineered to perform.",
  positioning: "Old website → modern MVP website in 48 hours.",
  domain: process.env.NEXT_PUBLIC_WLABS_DOMAIN ?? "wlabs.co",
  contactEmail: "hello@wlabs.co",
  colors: {
    blue: "#2563EB",
    cyan: "#06B6D4",
    purple: "#8B5CF6",
    navy: "#0F172A",
    slate: "#334155",
    gray: "#F2F4F7",
    white: "#FFFFFF",
  },
} as const;

export const NAV_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Process", href: "/process" },
  { label: "Examples", href: "/examples" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
] as const;

export const PRIMARY_CTA = { label: "Get your website preview", href: "/contact" } as const;
export const SECONDARY_CTA = { label: "See how it works", href: "/process" } as const;

/**
 * Accepted industries / local business categories.
 * Used by lead qualification, industry templates, and form selects.
 * Keep `value` in sync with the IndustryKey union in shared/types.ts.
 */
export const INDUSTRIES = [
  { value: "dentist", label: "Dentist" },
  { value: "physiotherapist", label: "Physiotherapist" },
  { value: "plumber", label: "Plumber" },
  { value: "electrician", label: "Electrician" },
  { value: "lawyer", label: "Lawyer" },
  { value: "accountant", label: "Accountant" },
  { value: "real_estate", label: "Real Estate Agency" },
  { value: "restaurant", label: "Restaurant / Café" },
  { value: "beauty_clinic", label: "Beauty / Aesthetics Clinic" },
  { value: "construction", label: "Construction / Trades" },
  { value: "other", label: "Other Local Business" },
] as const;

/** MVP pricing - keep in sync with /pricing page and email templates. */
export const PRICING = {
  mvp: {
    name: "Website MVP",
    price: 999,
    currency: "EUR",
    turnaround: "48 hours after approval",
    includes: [
      "Homepage redesign",
      "Mobile-first UX",
      "Conversion-focused copy",
      "Contact form",
      "Basic SEO structure",
      "Preview before launch",
      "48-hour turnaround after approval",
    ],
  },
  carePlan: {
    name: "Care Plan",
    price: 99,
    currency: "EUR",
    period: "month",
    includes: ["Hosting", "Minor updates", "Technical maintenance", "Performance monitoring", "Support"],
  },
} as const;

export const PROCESS_STEPS = [
  {
    step: "01",
    title: "Analyze",
    description:
      "We run a standardized AI-powered audit of your current website against our 100-point conversion and UX framework.",
  },
  {
    step: "02",
    title: "Design",
    description:
      "We generate a modern MVP homepage concept tailored to your industry, business, and customers.",
  },
  {
    step: "03",
    title: "Build",
    description:
      "Once approved, we build the real MVP website with responsive layout, contact form, and basic SEO.",
  },
  {
    step: "04",
    title: "Launch",
    description: "Your new website goes live, hosting-ready, in 48 hours after approval.",
  },
] as const;

export const PROBLEM_POINTS = [
  "Outdated first impression",
  "Weak mobile experience",
  "Hidden contact options",
  "Unclear service messaging",
  "Low trust signals",
  "Slow or confusing layout",
] as const;

export const SOLUTION_CARDS = [
  {
    icon: "search",
    title: "We Analyze",
    description: "AI-powered audits identify what is holding your website back.",
  },
  {
    icon: "layout-template",
    title: "We Design",
    description: "Modern MVP websites built around clarity, trust, and conversion.",
  },
  {
    icon: "rocket",
    title: "We Elevate",
    description: "Fast, affordable launch support so your business looks professional online.",
  },
] as const;

export const OFFER_ITEMS = [
  "1 MVP homepage",
  "Mobile optimization",
  "Contact form",
  "WhatsApp / phone CTA",
  "Google Maps / location section",
  "Basic SEO structure",
  "Hosting-ready setup",
  "Launch support",
] as const;

export const TRUST_POINTS = [
  "Transparent fixed pricing",
  "Preview-first approach",
  "No bloated agency process",
  "Built with modern AI-assisted workflows",
  "Human quality control before launch",
  "Clear scope, fast delivery",
] as const;

/** Example industries shown on the Examples page (mockups, not real client logos). */
export const EXAMPLE_INDUSTRIES = [
  { value: "dentist", label: "Dentist", description: "Calm, modern, trust-first design for patient acquisition." },
  {
    value: "construction",
    label: "Trades Business",
    description: "Bold, rugged design that highlights reliability and service area.",
  },
  { value: "lawyer", label: "Law Firm", description: "Authoritative, credible design that builds confidence fast." },
  {
    value: "physiotherapist",
    label: "Physiotherapist",
    description: "Friendly, approachable design focused on booking appointments.",
  },
  { value: "restaurant", label: "Restaurant", description: "Appetite-driven visuals with menu and reservation CTAs." },
  {
    value: "real_estate",
    label: "Real Estate Agency",
    description: "Listings-first layout that builds local market credibility.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "Is this a full custom website?",
    answer:
      "The €999 MVP package is a professionally designed, modern homepage built on a proven high-converting structure and tailored to your business, copy, and brand. It's intentionally scoped as an MVP so we can deliver it fast - additional pages or custom features can be scoped separately.",
  },
  {
    question: "What is included in the €999?",
    answer:
      "A redesigned, mobile-first homepage with conversion-focused copywriting, a working contact form, WhatsApp/phone click-to-call, a location/contact section, basic on-page SEO, and a private preview before anything goes live.",
  },
  {
    question: "How fast can you launch?",
    answer:
      "Once you approve the preview and provide any missing content, your MVP website is typically ready within 48 hours.",
  },
  {
    question: "Do I need to provide content?",
    answer:
      "No - we draft the copy based on your existing website and information you share. You can request edits before launch. If you have specific photos, logos, or text you'd like used, you can send those too.",
  },
  {
    question: "Can I request changes?",
    answer:
      "Yes. Every project includes a preview stage where you can request changes before the final version is built and launched.",
  },
  {
    question: "Is hosting included?",
    answer:
      "The MVP package gets your site hosting-ready. Ongoing hosting, updates, and monitoring are available via our optional Care Plan (€99/month), or you can host it yourself.",
  },
  {
    question: "Can you connect my domain?",
    answer: "Yes - once your MVP is approved, we help connect it to your existing domain or a new one.",
  },
  {
    question: "Do you work with my industry?",
    answer:
      "WLABS uses configurable industry templates for dentists, physiotherapists, plumbers, electricians, lawyers, accountants, real estate agencies, restaurants/cafés, beauty/aesthetics clinics, and construction/trades businesses - and we can adapt to most local service businesses.",
  },
  {
    question: "Do you build online shops?",
    answer:
      "The MVP package is focused on lead-generation homepages for local businesses, not full e-commerce stores. If you need an online shop, get in touch and we can discuss scope separately.",
  },
  {
    question: "Who owns the website?",
    answer: "You do. Once launched, the website and its content belong to your business.",
  },
] as const;
