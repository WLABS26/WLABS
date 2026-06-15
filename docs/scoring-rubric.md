# WLABS 100-Point Website Audit Rubric

Every lead's website is scored against the same objective, repeatable rubric so
opportunity ranking is consistent across the whole pipeline. The categories and
point weights are the single source of truth in
[`src/modules/shared/types.ts`](../src/modules/shared/types.ts) (`AUDIT_CATEGORIES`),
and the deterministic scoring lives in
[`src/modules/audit-engine/heuristics.ts`](../src/modules/audit-engine/heuristics.ts).

## Categories (total: 100)

| # | Category | Points | What it measures |
|---|----------|:------:|------------------|
| A | First Impression & Visual Trust | 20 | Modern design, hierarchy, spacing, imagery, immediate credibility |
| B | Mobile Experience | 15 | Responsive layout, mobile CTA, tap targets, readable text |
| C | Conversion Readiness | 20 | Clear CTA, contact form, visible phone/email, above-the-fold value |
| D | Content Clarity | 15 | Clear headline, service explanation, benefit-driven copy, structure |
| E | Trust & Proof | 10 | Reviews, credentials, team/about, real photos, awards |
| F | Technical Basics | 10 | HTTPS, SEO title, meta description, H1, load speed |
| G | Local Business Signals | 10 | Address, map, opening hours, local keywords, service area |

## How a score becomes an opportunity level

`determineOpportunity(score, hasContact)`:

| Condition | Level |
|-----------|-------|
| No usable business contact (email/phone) | `reject` |
| Score `< 60` | `high_opportunity` |
| Score `60–75` | `medium_opportunity` |
| Score `> 75` | `low_opportunity` |

- **High** = clear upside from a modern MVP redesign — the best targets.
- **Medium** = solid base, conversion/clarity gaps worth fixing.
- **Low** = already fairly modern; limited redesign upside.
- **Reject** = no website, no contact, inaccessible, inappropriate, duplicate, or do-not-contact.

## Scope Market routing (`dedicated_sales`)

Leads discovered via Scope Market (`source: "google_places_discovery"`) that
come back `low_opportunity` are rerouted from the regular redesign-prospects
pool to the `dedicated_sales` lead status — the existing `> 75` boundary above
is reused as-is, with no separate threshold. These businesses already have a
reasonably modern site, so they get a different pitch (e.g. additional
services, a second site/brand) instead of a redesign offer. CSV/manual leads
that land on `low_opportunity` are unaffected and keep today's behavior.

## Determinism

Scoring is signal-based (presence of viewport meta, forms, tap-to-call, map
embed, trust keywords, etc.) and rounded per category, so the **same site always
produces the same score**. This keeps the sales process honest and the funnel
metrics meaningful. An AI provider can later enrich the written narrative, but
the numbers always come from the deterministic engine.

## Output of an audit

Each audit produces: `overallScore`, per-category `categoryScores`, `topIssues`,
`quickWins`, `recommendedPositioning`, `salesAngle`, `urgencyReason`,
`redesignPotential`, and `qualificationStatus`.

### Critical findings (AI-enhanced)

Every audit also produces `criticalFindings` (3-5 sharper, harsher UX/
conversion problems), `bestPracticeComparison`, and `benchmarkGap` — a
qualitative comparison to best-practice sites in the same industry. The
deterministic engine (`heuristics.ts`) always produces a template-based
default for these from the same signals as `topIssues`/`quickWins`. If a real
AI provider is configured, `website_audit_agent` sends that draft to the model
for a sharper rewrite of just these three fields and merges the result back in
— **never** touching `overallScore`, `categoryScores`, or
`qualificationStatus`, preserving the "same site → same score" guarantee. Any
AI failure or invalid response silently falls back to the template draft, as
in mock mode.
