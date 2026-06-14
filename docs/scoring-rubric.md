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
