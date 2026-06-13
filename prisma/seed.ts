/**
 * WLABS database seed script.
 * Run with `npm run db:seed` (requires DATABASE_URL configured and migrated).
 *
 * Populates a realistic mock dataset for local development of the Phase 2
 * admin dashboard: leads spanning every industry and pipeline status, a
 * suppression list, inbound requests, audits, activity timelines, and
 * workflow runs/steps for the agent pipeline.
 */
import "dotenv/config";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AUDIT_CATEGORIES } from "@/modules/shared/types";
import type {
  CategoryScores,
  LeadQualification,
  LeadStatus,
} from "@/modules/shared/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = Date.now();

/** A Date `days` (and optional `hours`) in the past, for realistic timelines. */
function daysAgo(days: number, hours = 0): Date {
  return new Date(NOW - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000);
}

/**
 * Distribute an audit score across the 7 rubric categories at a given quality
 * ratio (0-1), rounded per category. Returns the per-category scores plus the
 * summed overall score so they always agree.
 */
function buildCategoryScores(qualityRatio: number): { categoryScores: CategoryScores; overallScore: number } {
  const categoryScores = {} as CategoryScores;
  let overallScore = 0;
  for (const category of AUDIT_CATEGORIES) {
    const points = Math.round(category.maxPoints * qualityRatio);
    categoryScores[category.key] = points;
    overallScore += points;
  }
  return { categoryScores, overallScore };
}

// ---------------------------------------------------------------------------
// Lead seed data
// ---------------------------------------------------------------------------

interface LeadSeed {
  businessName: string;
  slug: string;
  industry: string;
  websiteUrl: string | null;
  city: string;
  country: string;
  contactEmail: string | null;
  contactPhone: string | null;
  contactPerson: string | null;
  source: string;
  status: LeadStatus;
  qualificationStatus: LeadQualification | null;
  auditScore: number | null;
  doNotContact?: boolean;
  notes: string | null;
  createdDaysAgo: number;
}

const LEAD_SEEDS: LeadSeed[] = [
  {
    businessName: "Smith Dental Clinic",
    slug: "smith-dental-clinic",
    industry: "dentist",
    websiteUrl: "https://smithdental.example.com",
    city: "Manchester",
    country: "United Kingdom",
    contactEmail: "info@smithdental.example.com",
    contactPhone: "+44 161 555 0142",
    contactPerson: "Dr. Helen Smith",
    source: "csv_import",
    status: "imported",
    qualificationStatus: null,
    auditScore: null,
    notes: "Imported from the Greater Manchester dental list. Awaiting qualification.",
    createdDaysAgo: 1,
  },
  {
    businessName: "Sunrise Family Dentistry",
    slug: "sunrise-family-dentistry",
    industry: "dentist",
    websiteUrl: "https://sunrisefamilydental.example.com",
    city: "Bristol",
    country: "United Kingdom",
    contactEmail: "hello@sunrisefamilydental.example.com",
    contactPhone: "+44 117 555 0188",
    contactPerson: "Dr. Marcus Lee",
    source: "manual",
    status: "high_opportunity",
    qualificationStatus: "ready_for_crawl",
    auditScore: 48,
    notes: "Dated template site, no mobile optimisation. Strong redesign candidate.",
    createdDaysAgo: 9,
  },
  {
    businessName: "QuickFix Plumbing",
    slug: "quickfix-plumbing",
    industry: "plumber",
    websiteUrl: "https://quickfixplumbing.example.com",
    city: "Leeds",
    country: "United Kingdom",
    contactEmail: "bookings@quickfixplumbing.example.com",
    contactPhone: "+44 113 555 0167",
    contactPerson: "Dave Hartley",
    source: "csv_import",
    status: "email_drafted",
    qualificationStatus: "ready_for_crawl",
    auditScore: 41,
    notes: "Preview generated and email drafted. Awaiting human approval before send.",
    createdDaysAgo: 14,
  },
  {
    businessName: "Fading Plumbing Services",
    slug: "fading-plumbing-services",
    industry: "plumber",
    websiteUrl: "https://fadingplumbing.example.com",
    city: "Sheffield",
    country: "United Kingdom",
    contactEmail: "contact@fadingplumbing.example.com",
    contactPhone: "+44 114 555 0123",
    contactPerson: "Roy Pickering",
    source: "csv_import",
    status: "crawled",
    qualificationStatus: "ready_for_crawl",
    auditScore: null,
    notes: "Crawl agent timed out twice fetching the homepage. Needs a manual retry.",
    createdDaysAgo: 6,
  },
  {
    businessName: "Riverside Physiotherapy",
    slug: "riverside-physiotherapy",
    industry: "physiotherapist",
    websiteUrl: "https://riversidephysio.example.com",
    city: "Nottingham",
    country: "United Kingdom",
    contactEmail: "clinic@riversidephysio.example.com",
    contactPhone: "+44 115 555 0199",
    contactPerson: "Sarah Okonkwo",
    source: "manual",
    status: "audited",
    qualificationStatus: "ready_for_crawl",
    auditScore: 63,
    notes: "Audit complete - medium opportunity. Workflow generating redesign brief.",
    createdDaysAgo: 4,
  },
  {
    businessName: "Bright Spark Electrical",
    slug: "bright-spark-electrical",
    industry: "electrician",
    websiteUrl: "https://brightsparkelectrical.example.com",
    city: "Birmingham",
    country: "United Kingdom",
    contactEmail: "jobs@brightsparkelectrical.example.com",
    contactPhone: "+44 121 555 0134",
    contactPerson: "Tom Whitfield",
    source: "csv_import",
    status: "approved",
    qualificationStatus: "ready_for_crawl",
    auditScore: 52,
    notes: "Preview and email approved by reviewer. Ready to contact.",
    createdDaysAgo: 18,
  },
  {
    businessName: "Harlow & Co Law",
    slug: "harlow-and-co-law",
    industry: "lawyer",
    websiteUrl: "https://harlowcolaw.example.com",
    city: "London",
    country: "United Kingdom",
    contactEmail: "enquiries@harlowcolaw.example.com",
    contactPhone: "+44 20 7555 0156",
    contactPerson: "Priya Nair",
    source: "manual",
    status: "qualified",
    qualificationStatus: "ready_for_crawl",
    auditScore: null,
    notes: "Qualified and queued for crawl.",
    createdDaysAgo: 3,
  },
  {
    businessName: "Capital Law Partners",
    slug: "capital-law-partners",
    industry: "lawyer",
    websiteUrl: "https://capitallawpartners.example.com",
    city: "Edinburgh",
    country: "United Kingdom",
    contactEmail: "info@capitallawpartners.example.com",
    contactPhone: "+44 131 555 0177",
    contactPerson: "Alistair Grant",
    source: "csv_import",
    status: "contacted",
    qualificationStatus: "ready_for_crawl",
    auditScore: 58,
    notes: "Outreach email sent. Awaiting reply.",
    createdDaysAgo: 21,
  },
  {
    businessName: "Thompson Accounting",
    slug: "thompson-accounting",
    industry: "accountant",
    websiteUrl: "https://thompsonaccounting.example.com",
    city: "Glasgow",
    country: "United Kingdom",
    contactEmail: "team@thompsonaccounting.example.com",
    contactPhone: "+44 141 555 0145",
    contactPerson: "Karen Thompson",
    source: "csv_import",
    status: "low_opportunity",
    qualificationStatus: "ready_for_crawl",
    auditScore: 79,
    notes: "Site already fairly modern. Low priority - parked for now.",
    createdDaysAgo: 12,
  },
  {
    businessName: "Bayview Realty",
    slug: "bayview-realty",
    industry: "real_estate",
    websiteUrl: "https://bayviewrealty.example.com",
    city: "Brighton",
    country: "United Kingdom",
    contactEmail: "sales@bayviewrealty.example.com",
    contactPhone: "+44 1273 555 012",
    contactPerson: "Olivia Bennett",
    source: "website_preview_form",
    status: "crawled",
    qualificationStatus: "ready_for_crawl",
    auditScore: null,
    notes: "Inbound preview request. Workflow running - crawl complete, audit in progress.",
    createdDaysAgo: 2,
  },
  {
    businessName: "Heritage Real Estate Group",
    slug: "heritage-real-estate-group",
    industry: "real_estate",
    websiteUrl: "https://heritagerealestate.example.com",
    city: "York",
    country: "United Kingdom",
    contactEmail: "office@heritagerealestate.example.com",
    contactPhone: "+44 1904 555 077",
    contactPerson: "Geoffrey Mills",
    source: "csv_import",
    status: "rejected",
    qualificationStatus: "rejected",
    auditScore: null,
    notes: "Website redirects to a national franchise portal - not an independent target.",
    createdDaysAgo: 16,
  },
  {
    businessName: "The Olive Branch Bistro",
    slug: "the-olive-branch-bistro",
    industry: "restaurant",
    websiteUrl: "https://olivebranchbistro.example.com",
    city: "Bath",
    country: "United Kingdom",
    contactEmail: "reservations@olivebranchbistro.example.com",
    contactPhone: "+44 1225 555 098",
    contactPerson: "Marco Rossi",
    source: "csv_import",
    status: "won",
    qualificationStatus: "ready_for_crawl",
    auditScore: 44,
    notes: "Closed won! MVP homepage live. Considering the Care Plan.",
    createdDaysAgo: 30,
  },
  {
    businessName: "Old Town Cafe",
    slug: "old-town-cafe",
    industry: "restaurant",
    websiteUrl: "https://oldtowncafe.example.com",
    city: "Chester",
    country: "United Kingdom",
    contactEmail: "hello@oldtowncafe.example.com",
    contactPhone: "+44 1244 555 061",
    contactPerson: "Emma Clarke",
    source: "website_preview_form",
    status: "booked_call",
    qualificationStatus: "ready_for_crawl",
    auditScore: 55,
    notes: "Replied to outreach and booked a 15-minute launch call.",
    createdDaysAgo: 11,
  },
  {
    businessName: "Glow Beauty Studio",
    slug: "glow-beauty-studio",
    industry: "beauty_clinic",
    websiteUrl: "https://glowbeautystudio.example.com",
    city: "Cardiff",
    country: "United Kingdom",
    contactEmail: "bookings@glowbeautystudio.example.com",
    contactPhone: "+44 29 2055 0143",
    contactPerson: "Nia Davies",
    source: "website_preview_form",
    status: "preview_generated",
    qualificationStatus: "ready_for_crawl",
    auditScore: 51,
    notes: "Preview generated from inbound request. Waiting in the QC approval queue.",
    createdDaysAgo: 5,
  },
  {
    businessName: "Granite Construction Co",
    slug: "granite-construction-co",
    industry: "construction",
    websiteUrl: "https://graniteconstruction.example.com",
    city: "Aberdeen",
    country: "United Kingdom",
    contactEmail: "projects@graniteconstruction.example.com",
    contactPhone: "+44 1224 555 029",
    contactPerson: "Stuart MacLeod",
    source: "csv_import",
    status: "lost",
    qualificationStatus: "ready_for_crawl",
    auditScore: 66,
    notes: "Replied but decided to stay with their current provider for now.",
    createdDaysAgo: 25,
  },
  {
    businessName: "Noise Complaint Gym",
    slug: "noise-complaint-gym",
    industry: "other",
    websiteUrl: "https://noisecomplaintgym.example.com",
    city: "Liverpool",
    country: "United Kingdom",
    contactEmail: "manager@noisecomplaintgym.example.com",
    contactPhone: "+44 151 555 0190",
    contactPerson: "Gary Boyle",
    source: "csv_import",
    status: "suppressed",
    qualificationStatus: "rejected",
    auditScore: null,
    doNotContact: true,
    notes: "Asked not to be contacted again. Added to suppression list.",
    createdDaysAgo: 20,
  },
];

// ---------------------------------------------------------------------------
// Seeders
// ---------------------------------------------------------------------------

async function seedSuppressions() {
  await prisma.suppression.createMany({
    data: [
      {
        email: "manager@noisecomplaintgym.example.com",
        websiteUrl: "https://noisecomplaintgym.example.com",
        reason: "Recipient replied 'no thanks' and requested no further contact.",
        createdAt: daysAgo(19),
      },
      {
        email: "owner@privacyfirst.example.com",
        websiteUrl: null,
        reason: "GDPR erasure request received via the contact form.",
        createdAt: daysAgo(33),
      },
      {
        email: null,
        websiteUrl: "https://competitor-agency.example.com",
        reason: "Competitor domain - excluded from all outreach.",
        createdAt: daysAgo(40),
      },
    ],
  });
}

type SeededLead = Awaited<ReturnType<typeof prisma.lead.create>>;

async function seedLeads(): Promise<Record<string, SeededLead>> {
  const bySlug: Record<string, SeededLead> = {};
  for (const seed of LEAD_SEEDS) {
    const createdAt = daysAgo(seed.createdDaysAgo);
    const lead = await prisma.lead.create({
      data: {
        businessName: seed.businessName,
        slug: seed.slug,
        industry: seed.industry,
        websiteUrl: seed.websiteUrl,
        city: seed.city,
        country: seed.country,
        contactEmail: seed.contactEmail,
        contactPhone: seed.contactPhone,
        contactPerson: seed.contactPerson,
        source: seed.source,
        status: seed.status,
        qualificationStatus: seed.qualificationStatus,
        auditScore: seed.auditScore,
        doNotContact: seed.doNotContact ?? false,
        notes: seed.notes,
        createdAt,
        updatedAt: createdAt,
      },
    });
    bySlug[seed.slug] = lead;
  }
  return bySlug;
}

type LeadMap = Record<string, SeededLead>;

interface AuditSeed {
  slug: string;
  qualityRatio: number;
  qualificationStatus: "high_opportunity" | "medium_opportunity" | "low_opportunity";
  topIssues: string[];
  quickWins: string[];
  recommendedPositioning: string;
  salesAngle: string;
  urgencyReason: string;
  redesignPotential: string;
  createdDaysAgo: number;
}

const AUDIT_SEEDS: AuditSeed[] = [
  {
    slug: "sunrise-family-dentistry",
    qualityRatio: 0.48,
    qualificationStatus: "high_opportunity",
    topIssues: [
      "Homepage is not responsive on mobile devices",
      "Primary phone number is buried in the footer",
      "No clear appointment-booking call to action above the fold",
    ],
    quickWins: ["Add a sticky 'Book an appointment' button", "Surface the phone number in the header"],
    recommendedPositioning: "The friendly, modern family dentist for Bristol families.",
    salesAngle: "A dated site is costing easy appointment bookings from mobile visitors.",
    urgencyReason: "Most patients search for a dentist on their phone - the current site fails that test.",
    redesignPotential: "High - strong local demand paired with a weak existing site.",
    createdDaysAgo: 8,
  },
  {
    slug: "quickfix-plumbing",
    qualityRatio: 0.41,
    qualificationStatus: "high_opportunity",
    topIssues: [
      "No visible emergency call-out number on mobile",
      "Generic stock photography with no real job photos",
      "Slow homepage load (large unoptimised hero image)",
    ],
    quickWins: ["Add a click-to-call emergency button", "Show a service-area map for Leeds"],
    recommendedPositioning: "Fast, reliable emergency plumbing across Leeds.",
    salesAngle: "Emergency customers bounce when they cannot tap to call instantly.",
    urgencyReason: "Plumbing is urgent-intent - a slow, hard-to-call site loses jobs to competitors.",
    redesignPotential: "High - conversion-led layout would lift call volume quickly.",
    createdDaysAgo: 13,
  },
  {
    slug: "riverside-physiotherapy",
    qualityRatio: 0.63,
    qualificationStatus: "medium_opportunity",
    topIssues: [
      "Booking flow requires three clicks to reach the contact form",
      "Testimonials are present but visually buried",
      "Service descriptions are vague and not benefit-led",
    ],
    quickWins: ["Add an above-the-fold 'Book now' CTA", "Promote existing patient reviews higher up"],
    recommendedPositioning: "Approachable, results-focused physiotherapy in Nottingham.",
    salesAngle: "The clinic has good proof but hides it - small changes would lift bookings.",
    urgencyReason: "Competing clinics offer one-tap booking the current site lacks.",
    redesignPotential: "Medium - solid foundation, mainly conversion and clarity gaps.",
    createdDaysAgo: 3,
  },
  {
    slug: "bright-spark-electrical",
    qualityRatio: 0.52,
    qualificationStatus: "high_opportunity",
    topIssues: [
      "No trust signals (certifications, reviews) near the contact area",
      "Mobile navigation menu is difficult to use",
      "Headline does not state what services are offered",
    ],
    quickWins: ["Display NICEIC-style accreditations near the CTA", "Add a clear services headline"],
    recommendedPositioning: "Certified, dependable electricians for Birmingham homes and businesses.",
    salesAngle: "A clearer, trust-forward homepage would convert more quote requests.",
    urgencyReason: "Buyers shortlist electricians on trust cues the site currently omits.",
    redesignPotential: "High - clear messaging and trust elements would lift enquiries.",
    createdDaysAgo: 17,
  },
  {
    slug: "capital-law-partners",
    qualityRatio: 0.58,
    qualificationStatus: "high_opportunity",
    topIssues: [
      "Dense text blocks with no clear practice-area structure",
      "Contact form is below several screens of scrolling",
      "Outdated visual design undermines a premium positioning",
    ],
    quickWins: ["Add practice-area cards near the top", "Move the consultation CTA above the fold"],
    recommendedPositioning: "Trusted Edinburgh legal partners for individuals and businesses.",
    salesAngle: "A modern, structured homepage would better match the firm's reputation.",
    urgencyReason: "First impressions matter in legal services - the design reads as dated.",
    redesignPotential: "High - strong brand, weak digital first impression.",
    createdDaysAgo: 20,
  },
  {
    slug: "thompson-accounting",
    qualityRatio: 0.79,
    qualificationStatus: "low_opportunity",
    topIssues: [
      "Minor: hero copy could be more benefit-led",
      "Minor: a couple of internal links point to outdated pages",
    ],
    quickWins: ["Refresh the hero headline", "Fix the two stale footer links"],
    recommendedPositioning: "Modern accounting support for Glasgow's small businesses.",
    salesAngle: "Already fairly modern - limited redesign upside right now.",
    urgencyReason: "No urgent gaps; site performs reasonably well already.",
    redesignPotential: "Low - well-maintained site with only minor improvements available.",
    createdDaysAgo: 11,
  },
  {
    slug: "the-olive-branch-bistro",
    qualityRatio: 0.44,
    qualificationStatus: "high_opportunity",
    topIssues: [
      "Menu is a hard-to-read PDF download",
      "No online reservation option",
      "Photos are low resolution and poorly lit",
    ],
    quickWins: ["Add an HTML menu section", "Add a 'Reserve a table' CTA"],
    recommendedPositioning: "Warm, modern Mediterranean dining in the heart of Bath.",
    salesAngle: "Diners decide on mobile - the current site makes menus and booking hard.",
    urgencyReason: "Restaurant discovery is mobile-first; the PDF menu loses bookings.",
    redesignPotential: "High - appetising visuals and easy booking would convert well.",
    createdDaysAgo: 29,
  },
  {
    slug: "old-town-cafe",
    qualityRatio: 0.55,
    qualificationStatus: "high_opportunity",
    topIssues: [
      "Opening hours are not visible without scrolling",
      "No map or directions to the cafe",
      "Social links are broken",
    ],
    quickWins: ["Show opening hours in the header", "Embed a location map"],
    recommendedPositioning: "A cosy neighbourhood cafe in the heart of old Chester.",
    salesAngle: "Local-intent visitors want hours and directions fast - both are hidden.",
    urgencyReason: "Footfall depends on quick answers the current site does not surface.",
    redesignPotential: "High - simple local-signal fixes would noticeably help.",
    createdDaysAgo: 10,
  },
  {
    slug: "glow-beauty-studio",
    qualityRatio: 0.51,
    qualificationStatus: "high_opportunity",
    topIssues: [
      "No online booking integration",
      "Treatment pricing is not listed",
      "Gallery images are slow to load on mobile",
    ],
    quickWins: ["Add a 'Book a treatment' CTA", "Publish a clear price list"],
    recommendedPositioning: "Modern beauty and aesthetics treatments in central Cardiff.",
    salesAngle: "Clients expect to book and see prices instantly - both are missing.",
    urgencyReason: "Beauty bookings skew mobile and impulse-driven; friction loses clients.",
    redesignPotential: "High - booking and pricing clarity would lift conversions.",
    createdDaysAgo: 4,
  },
  {
    slug: "granite-construction-co",
    qualityRatio: 0.66,
    qualificationStatus: "medium_opportunity",
    topIssues: [
      "Project gallery exists but lacks captions or context",
      "No clear request-a-quote pathway",
      "Copy is feature-led rather than outcome-led",
    ],
    quickWins: ["Add a prominent 'Request a quote' CTA", "Caption the project gallery"],
    recommendedPositioning: "Reliable construction and trades partner across Aberdeen.",
    salesAngle: "Good proof of work, but no clear next step for interested buyers.",
    urgencyReason: "Competitors offer simpler quote requests; this site adds friction.",
    redesignPotential: "Medium - decent content, mainly conversion-path gaps.",
    createdDaysAgo: 24,
  },
];

async function seedAudits(leads: LeadMap) {
  for (const seed of AUDIT_SEEDS) {
    const lead = leads[seed.slug];
    if (!lead) continue;
    const { categoryScores, overallScore } = buildCategoryScores(seed.qualityRatio);
    await prisma.audit.create({
      data: {
        leadId: lead.id,
        overallScore,
        categoryScoresJson: categoryScores,
        topIssuesJson: seed.topIssues,
        quickWinsJson: seed.quickWins,
        recommendedPositioning: seed.recommendedPositioning,
        salesAngle: seed.salesAngle,
        urgencyReason: seed.urgencyReason,
        redesignPotential: seed.redesignPotential,
        qualificationStatus: seed.qualificationStatus,
        createdAt: daysAgo(seed.createdDaysAgo),
      },
    });
  }
}

interface ActivitySeed {
  type: string;
  description: string;
  daysAgo: number;
  hours?: number;
  metadata?: Record<string, unknown>;
}

const ACTIVITY_SEEDS: Record<string, ActivitySeed[]> = {
  "smith-dental-clinic": [
    { type: "lead_imported", description: "Imported from the Greater Manchester dental CSV.", daysAgo: 1 },
  ],
  "sunrise-family-dentistry": [
    { type: "lead_imported", description: "Lead created manually via the admin dashboard.", daysAgo: 9 },
    { type: "lead_qualified", description: "Qualified as ready for crawl.", daysAgo: 8, hours: 20 },
    { type: "audit_completed", description: "Audit scored 48/100 - high opportunity.", daysAgo: 8 },
    { type: "status_changed", description: 'Status changed to "high opportunity".', daysAgo: 8, metadata: { status: "high_opportunity" } },
  ],
  "quickfix-plumbing": [
    { type: "lead_imported", description: "Imported from the Leeds trades CSV.", daysAgo: 14 },
    { type: "audit_completed", description: "Audit scored 41/100 - high opportunity.", daysAgo: 13 },
    { type: "preview_generated", description: "Preview homepage concept generated.", daysAgo: 12 },
    { type: "email_drafted", description: "Direct-preview outreach email drafted.", daysAgo: 11, metadata: { variant: "direct_preview" } },
  ],
  "fading-plumbing-services": [
    { type: "lead_imported", description: "Imported from the Sheffield trades CSV.", daysAgo: 6 },
    { type: "crawl_failed", description: "Crawl timed out after 30s (attempt 2).", daysAgo: 5, metadata: { code: "CRAWL_TIMEOUT" } },
  ],
  "riverside-physiotherapy": [
    { type: "lead_imported", description: "Lead created manually via the admin dashboard.", daysAgo: 4 },
    { type: "audit_completed", description: "Audit scored 63/100 - medium opportunity.", daysAgo: 3 },
  ],
  "bright-spark-electrical": [
    { type: "lead_imported", description: "Imported from the Birmingham trades CSV.", daysAgo: 18 },
    { type: "audit_completed", description: "Audit scored 52/100 - high opportunity.", daysAgo: 17 },
    { type: "preview_approved", description: "Preview approved in the review queue.", daysAgo: 15 },
    { type: "email_approved", description: "Outreach email approved and ready to send.", daysAgo: 14 },
    { type: "status_changed", description: 'Status changed to "approved".', daysAgo: 14, metadata: { status: "approved" } },
  ],
  "harlow-and-co-law": [
    { type: "lead_imported", description: "Lead created manually via the admin dashboard.", daysAgo: 3 },
    { type: "lead_qualified", description: "Qualified as ready for crawl.", daysAgo: 2, hours: 12 },
  ],
  "capital-law-partners": [
    { type: "lead_imported", description: "Imported from the Edinburgh professional-services CSV.", daysAgo: 21 },
    { type: "audit_completed", description: "Audit scored 58/100 - high opportunity.", daysAgo: 19 },
    { type: "preview_approved", description: "Preview approved in the review queue.", daysAgo: 17 },
    { type: "email_sent", description: "Outreach email marked as sent.", daysAgo: 15 },
    { type: "status_changed", description: 'Status changed to "contacted".', daysAgo: 15, metadata: { status: "contacted" } },
  ],
  "thompson-accounting": [
    { type: "lead_imported", description: "Imported from the Glasgow professional-services CSV.", daysAgo: 12 },
    { type: "audit_completed", description: "Audit scored 79/100 - low opportunity.", daysAgo: 11 },
    { type: "note", description: "Site already modern - parking as low priority.", daysAgo: 10 },
  ],
  "bayview-realty": [
    { type: "inbound_request_received", description: "Inbound preview request via the website form.", daysAgo: 2 },
    { type: "lead_imported", description: "Lead created from inbound request (website_preview_form).", daysAgo: 2 },
    { type: "crawl_completed", description: "Homepage crawled successfully.", daysAgo: 1, hours: 6 },
  ],
  "heritage-real-estate-group": [
    { type: "lead_imported", description: "Imported from the York property CSV.", daysAgo: 16 },
    { type: "lead_rejected", description: "Rejected - redirects to a national franchise portal.", daysAgo: 15 },
  ],
  "the-olive-branch-bistro": [
    { type: "lead_imported", description: "Imported from the Bath hospitality CSV.", daysAgo: 30 },
    { type: "audit_completed", description: "Audit scored 44/100 - high opportunity.", daysAgo: 29 },
    { type: "email_sent", description: "Outreach email marked as sent.", daysAgo: 26 },
    { type: "reply_received", description: "Owner replied expressing interest.", daysAgo: 24 },
    { type: "status_changed", description: 'Status changed to "won".', daysAgo: 18, metadata: { status: "won" } },
  ],
  "old-town-cafe": [
    { type: "inbound_request_received", description: "Inbound preview request via the website form.", daysAgo: 11 },
    { type: "audit_completed", description: "Audit scored 55/100 - high opportunity.", daysAgo: 10 },
    { type: "email_sent", description: "Outreach email marked as sent.", daysAgo: 8 },
    { type: "status_changed", description: 'Status changed to "booked call".', daysAgo: 6, metadata: { status: "booked_call" } },
  ],
  "glow-beauty-studio": [
    { type: "inbound_request_received", description: "Inbound preview request via the website form.", daysAgo: 5 },
    { type: "audit_completed", description: "Audit scored 51/100 - high opportunity.", daysAgo: 4 },
    { type: "preview_generated", description: "Preview homepage concept generated - awaiting QC.", daysAgo: 3 },
  ],
  "granite-construction-co": [
    { type: "lead_imported", description: "Imported from the Aberdeen trades CSV.", daysAgo: 25 },
    { type: "audit_completed", description: "Audit scored 66/100 - medium opportunity.", daysAgo: 24 },
    { type: "email_sent", description: "Outreach email marked as sent.", daysAgo: 21 },
    { type: "status_changed", description: 'Status changed to "lost".', daysAgo: 17, metadata: { status: "lost" } },
  ],
  "noise-complaint-gym": [
    { type: "lead_imported", description: "Imported from the Liverpool local-business CSV.", daysAgo: 20 },
    { type: "reply_received", description: "Recipient replied 'no thanks'.", daysAgo: 19 },
    { type: "lead_suppressed", description: "Added to the suppression list and marked do-not-contact.", daysAgo: 19 },
  ],
};

async function seedActivities(leads: LeadMap) {
  for (const [slug, activities] of Object.entries(ACTIVITY_SEEDS)) {
    const lead = leads[slug];
    if (!lead) continue;
    for (const activity of activities) {
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: activity.type,
          description: activity.description,
          metadataJson: activity.metadata as Prisma.InputJsonValue | undefined,
          createdAt: daysAgo(activity.daysAgo, activity.hours ?? 0),
        },
      });
    }
  }
}

interface InboundSeed {
  name: string;
  businessName: string | null;
  websiteUrl: string | null;
  email: string;
  phone: string | null;
  industry: string | null;
  message: string | null;
  status: "new" | "processing" | "converted" | "closed";
  leadSlug: string | null;
  createdDaysAgo: number;
}

const INBOUND_SEEDS: InboundSeed[] = [
  {
    name: "Olivia Bennett",
    businessName: "Bayview Realty",
    websiteUrl: "https://bayviewrealty.example.com",
    email: "sales@bayviewrealty.example.com",
    phone: "+44 1273 555 012",
    industry: "real_estate",
    message: "Saw your examples - would love a preview of how our listings page could look.",
    status: "converted",
    leadSlug: "bayview-realty",
    createdDaysAgo: 2,
  },
  {
    name: "Emma Clarke",
    businessName: "Old Town Cafe",
    websiteUrl: "https://oldtowncafe.example.com",
    email: "hello@oldtowncafe.example.com",
    phone: "+44 1244 555 061",
    industry: "restaurant",
    message: "Our site is ancient. Can you show us what a modern version would look like?",
    status: "converted",
    leadSlug: "old-town-cafe",
    createdDaysAgo: 11,
  },
  {
    name: "Nia Davies",
    businessName: "Glow Beauty Studio",
    websiteUrl: "https://glowbeautystudio.example.com",
    email: "bookings@glowbeautystudio.example.com",
    phone: "+44 29 2055 0143",
    industry: "beauty_clinic",
    message: "Interested in online booking and a fresh homepage.",
    status: "converted",
    leadSlug: "glow-beauty-studio",
    createdDaysAgo: 5,
  },
  {
    name: "James Whitaker",
    businessName: "Whitaker Joinery",
    websiteUrl: null,
    email: "james@whitakerjoinery.example.com",
    phone: "+44 191 555 0102",
    industry: "construction",
    message: "We don't have a website yet - can you build one from scratch?",
    status: "new",
    leadSlug: null,
    createdDaysAgo: 1,
  },
  {
    name: "Anonymous Enquiry",
    businessName: null,
    websiteUrl: null,
    email: "curious.visitor@example.com",
    phone: null,
    industry: null,
    message: "What's included in the 999 euro package? Just researching for now.",
    status: "new",
    leadSlug: null,
    createdDaysAgo: 0,
  },
  {
    name: "Gary Boyle",
    businessName: "Noise Complaint Gym",
    websiteUrl: "https://noisecomplaintgym.example.com",
    email: "manager@noisecomplaintgym.example.com",
    phone: "+44 151 555 0190",
    industry: "other",
    message: "Stop emailing me.",
    status: "closed",
    leadSlug: "noise-complaint-gym",
    createdDaysAgo: 19,
  },
];

async function seedInboundRequests(leads: LeadMap) {
  for (const seed of INBOUND_SEEDS) {
    await prisma.inboundRequest.create({
      data: {
        name: seed.name,
        businessName: seed.businessName,
        websiteUrl: seed.websiteUrl,
        email: seed.email,
        phone: seed.phone,
        industry: seed.industry,
        message: seed.message,
        status: seed.status,
        leadId: seed.leadSlug ? (leads[seed.leadSlug]?.id ?? null) : null,
        createdAt: daysAgo(seed.createdDaysAgo),
      },
    });
  }
}

interface StepSeed {
  agentName: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped" | "waiting_for_approval" | "retrying";
  startedDaysAgo?: number;
  startedHours?: number;
  completedDaysAgo?: number;
  completedHours?: number;
  retryCount?: number;
  output?: Record<string, unknown>;
  error?: Record<string, unknown>;
}

interface WorkflowSeed {
  workflowType: string;
  status: "pending" | "running" | "waiting_for_approval" | "completed" | "failed" | "cancelled" | "paused";
  leadSlug: string;
  createdBy: string;
  createdDaysAgo: number;
  startedDaysAgo?: number;
  startedHours?: number;
  completedDaysAgo?: number;
  completedHours?: number;
  steps: StepSeed[];
}

/** The standard full agent pipeline, in order. */
const PIPELINE = [
  "lead_qualification_agent",
  "website_crawl_agent",
  "website_audit_agent",
  "redesign_brief_agent",
  "preview_generator_agent",
  "preview_qc_agent",
  "email_drafting_agent",
  "email_qc_agent",
] as const;

/** Build a sequence of completed steps for a full pipeline run on a single day window. */
function completedPipeline(baseDaysAgo: number): StepSeed[] {
  return PIPELINE.map((agentName, i) => ({
    agentName,
    status: "completed" as const,
    startedDaysAgo: baseDaysAgo,
    startedHours: 8 - i * 0.75,
    completedDaysAgo: baseDaysAgo,
    completedHours: 8 - i * 0.75 - 0.5,
  }));
}

const WORKFLOW_SEEDS: WorkflowSeed[] = [
  {
    workflowType: "full_pipeline",
    status: "completed",
    leadSlug: "bright-spark-electrical",
    createdBy: "batch:morning-run",
    createdDaysAgo: 17,
    startedDaysAgo: 17,
    startedHours: 8,
    completedDaysAgo: 17,
    completedHours: 2,
    steps: completedPipeline(17),
  },
  {
    workflowType: "full_pipeline",
    status: "completed",
    leadSlug: "capital-law-partners",
    createdBy: "batch:morning-run",
    createdDaysAgo: 20,
    startedDaysAgo: 20,
    startedHours: 8,
    completedDaysAgo: 20,
    completedHours: 2,
    steps: completedPipeline(20),
  },
  {
    workflowType: "full_pipeline",
    status: "completed",
    leadSlug: "the-olive-branch-bistro",
    createdBy: "batch:morning-run",
    createdDaysAgo: 29,
    startedDaysAgo: 29,
    startedHours: 8,
    completedDaysAgo: 29,
    completedHours: 2,
    steps: completedPipeline(29),
  },
  {
    workflowType: "full_pipeline",
    status: "completed",
    leadSlug: "quickfix-plumbing",
    createdBy: "batch:morning-run",
    createdDaysAgo: 13,
    startedDaysAgo: 13,
    startedHours: 8,
    completedDaysAgo: 13,
    completedHours: 2,
    steps: completedPipeline(13),
  },
  {
    workflowType: "inbound_pipeline",
    status: "running",
    leadSlug: "bayview-realty",
    createdBy: "inbound:website_preview_form",
    createdDaysAgo: 2,
    startedDaysAgo: 2,
    startedHours: 3,
    steps: [
      { agentName: "lead_qualification_agent", status: "completed", startedDaysAgo: 2, startedHours: 3, completedDaysAgo: 2, completedHours: 2.8 },
      { agentName: "website_crawl_agent", status: "completed", startedDaysAgo: 1, startedHours: 6.5, completedDaysAgo: 1, completedHours: 6 },
      { agentName: "website_audit_agent", status: "running", startedDaysAgo: 1, startedHours: 5.5 },
      { agentName: "redesign_brief_agent", status: "pending" },
      { agentName: "preview_generator_agent", status: "pending" },
      { agentName: "preview_qc_agent", status: "pending" },
    ],
  },
  {
    workflowType: "full_pipeline",
    status: "running",
    leadSlug: "riverside-physiotherapy",
    createdBy: "batch:afternoon-run",
    createdDaysAgo: 4,
    startedDaysAgo: 4,
    startedHours: 5,
    steps: [
      { agentName: "lead_qualification_agent", status: "completed", startedDaysAgo: 4, startedHours: 5, completedDaysAgo: 4, completedHours: 4.8 },
      { agentName: "website_crawl_agent", status: "completed", startedDaysAgo: 4, startedHours: 4.5, completedDaysAgo: 4, completedHours: 4 },
      { agentName: "website_audit_agent", status: "completed", startedDaysAgo: 3, startedHours: 9, completedDaysAgo: 3, completedHours: 8.5 },
      { agentName: "redesign_brief_agent", status: "running", startedDaysAgo: 3, startedHours: 8 },
      { agentName: "preview_generator_agent", status: "pending" },
      { agentName: "preview_qc_agent", status: "pending" },
      { agentName: "email_drafting_agent", status: "pending" },
      { agentName: "email_qc_agent", status: "pending" },
    ],
  },
  {
    workflowType: "inbound_pipeline",
    status: "waiting_for_approval",
    leadSlug: "glow-beauty-studio",
    createdBy: "inbound:website_preview_form",
    createdDaysAgo: 5,
    startedDaysAgo: 5,
    startedHours: 4,
    steps: [
      { agentName: "lead_qualification_agent", status: "completed", startedDaysAgo: 5, startedHours: 4, completedDaysAgo: 5, completedHours: 3.8 },
      { agentName: "website_crawl_agent", status: "completed", startedDaysAgo: 5, startedHours: 3.5, completedDaysAgo: 5, completedHours: 3 },
      { agentName: "website_audit_agent", status: "completed", startedDaysAgo: 4, startedHours: 9, completedDaysAgo: 4, completedHours: 8.5 },
      { agentName: "redesign_brief_agent", status: "completed", startedDaysAgo: 4, startedHours: 8, completedDaysAgo: 4, completedHours: 7.5 },
      { agentName: "preview_generator_agent", status: "completed", startedDaysAgo: 3, startedHours: 7, completedDaysAgo: 3, completedHours: 6.5 },
      { agentName: "preview_qc_agent", status: "waiting_for_approval", startedDaysAgo: 3, startedHours: 6 },
    ],
  },
  {
    workflowType: "full_pipeline",
    status: "failed",
    leadSlug: "fading-plumbing-services",
    createdBy: "batch:morning-run",
    createdDaysAgo: 6,
    startedDaysAgo: 6,
    startedHours: 8,
    completedDaysAgo: 5,
    completedHours: 6,
    steps: [
      { agentName: "lead_qualification_agent", status: "completed", startedDaysAgo: 6, startedHours: 8, completedDaysAgo: 6, completedHours: 7.8 },
      {
        agentName: "website_crawl_agent",
        status: "failed",
        startedDaysAgo: 5,
        startedHours: 7,
        completedDaysAgo: 5,
        completedHours: 6,
        retryCount: 2,
        error: { message: "Timed out fetching https://fadingplumbing.example.com after 30s", code: "CRAWL_TIMEOUT" },
      },
      { agentName: "website_audit_agent", status: "skipped" },
      { agentName: "redesign_brief_agent", status: "skipped" },
      { agentName: "preview_generator_agent", status: "skipped" },
      { agentName: "preview_qc_agent", status: "skipped" },
    ],
  },
  {
    workflowType: "full_pipeline",
    status: "pending",
    leadSlug: "smith-dental-clinic",
    createdBy: "batch:queued",
    createdDaysAgo: 1,
    steps: PIPELINE.map((agentName) => ({ agentName, status: "pending" as const })),
  },
];

function stepTimestamp(daysAgo_?: number, hours = 0): Date | null {
  if (daysAgo_ === undefined) return null;
  return daysAgo(daysAgo_, hours);
}

async function seedWorkflowRuns(leads: LeadMap) {
  for (const run of WORKFLOW_SEEDS) {
    const lead = leads[run.leadSlug];
    if (!lead) continue;
    await prisma.workflowRun.create({
      data: {
        workflowType: run.workflowType,
        status: run.status,
        createdBy: run.createdBy,
        startedAt: stepTimestamp(run.startedDaysAgo, run.startedHours),
        completedAt: stepTimestamp(run.completedDaysAgo, run.completedHours),
        createdAt: daysAgo(run.createdDaysAgo),
        metadataJson: { leadSlug: run.leadSlug, businessName: lead.businessName } as Prisma.InputJsonValue,
        steps: {
          create: run.steps.map((step) => ({
            leadId: lead.id,
            agentName: step.agentName,
            status: step.status,
            retryCount: step.retryCount ?? 0,
            startedAt: stepTimestamp(step.startedDaysAgo, step.startedHours),
            completedAt: stepTimestamp(step.completedDaysAgo, step.completedHours),
            outputJson: step.output as Prisma.InputJsonValue | undefined,
            errorJson: step.error as Prisma.InputJsonValue | undefined,
          })),
        },
      },
    });
  }
}

async function main() {
  console.log("WLABS seed: clearing existing data...");
  // Order matters: clear dependents before parents. Lead cascades handle
  // WebsiteCapture/Audit/RedesignBrief/Preview/EmailDraft/Activity/WorkflowStep.
  await prisma.workflowStep.deleteMany();
  await prisma.workflowRun.deleteMany();
  await prisma.inboundRequest.deleteMany();
  await prisma.suppression.deleteMany();
  await prisma.lead.deleteMany();

  console.log("WLABS seed: creating suppression list...");
  await seedSuppressions();

  console.log("WLABS seed: creating leads...");
  const leads = await seedLeads();

  console.log("WLABS seed: creating audits...");
  await seedAudits(leads);

  console.log("WLABS seed: creating activity timelines...");
  await seedActivities(leads);

  console.log("WLABS seed: creating inbound requests...");
  await seedInboundRequests(leads);

  console.log("WLABS seed: creating workflow runs...");
  await seedWorkflowRuns(leads);

  const [leadCount, auditCount, activityCount, inboundCount, runCount, stepCount, suppressionCount] =
    await Promise.all([
      prisma.lead.count(),
      prisma.audit.count(),
      prisma.activity.count(),
      prisma.inboundRequest.count(),
      prisma.workflowRun.count(),
      prisma.workflowStep.count(),
      prisma.suppression.count(),
    ]);

  console.log("WLABS seed complete:");
  console.log(`  leads:          ${leadCount}`);
  console.log(`  audits:         ${auditCount}`);
  console.log(`  activities:     ${activityCount}`);
  console.log(`  inbound:        ${inboundCount}`);
  console.log(`  workflow runs:  ${runCount}`);
  console.log(`  workflow steps: ${stepCount}`);
  console.log(`  suppressions:   ${suppressionCount}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
