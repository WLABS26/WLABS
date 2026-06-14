# WLABS Security & Compliance Model

## Authentication

- Single-admin auth backed by an **HMAC-signed session cookie** (no external
  auth service required for the MVP). Credentials are configured via
  `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` (`sha256(password + email)`), generated
  with `npm run admin:hash`.
- `src/proxy.ts` gates every `/admin/*` route (including the CSV export route)
  and redirects unauthenticated requests to `/admin/login`.
- The session secret (`SESSION_SECRET`) signs and verifies the cookie; tokens
  carry an expiry and are checked with constant-time comparison.

## Crawler SSRF protection

`src/modules/crawler/ssrf.ts` validates every URL **before** any request:

- Only `http:` / `https:` schemes.
- Blocks `localhost`, `*.localhost`, `*.internal`.
- Resolves the hostname and rejects any loopback, private, link-local, CGNAT, or
  multicast address — including the cloud metadata IP `169.254.169.254` and
  IPv4-mapped IPv6.

`src/modules/crawler/fetch.ts` adds a hard timeout, a response-size cap, and a
desktop User-Agent, and returns structured failure reasons instead of throwing.

## Input validation & rate limiting

- All public form endpoints (`/api/leads/preview-request`, `/api/contact`)
  validate with zod and are rate-limited per IP (`src/lib/rate-limit.ts`).
- Suppression-list membership is never leaked: suppressed submissions get the
  same response as accepted ones.

## Compliance defaults (GDPR / ePrivacy)

- **Business-contact outreach only**; every email includes an opt-out line.
- **Draft-only** email mode — nothing is sent without human approval and a
  manual export step.
- **Suppression list** (by normalized email/website) checked before any lead is
  created or contacted; "no thanks"/opt-out adds to it and flags
  `doNotContact`.
- **Audit trail**: every lead has an activity timeline, and every agent run is
  persisted as `WorkflowRun` / `WorkflowStep` records.
- Privacy policy and imprint placeholders are provided under `/legal/*`.

## Preview privacy

- Generated previews carry a **private token**; unpublished previews return 404
  without the matching `?token=`.
- Preview pages are `noindex, nofollow`.

## Secrets

- API keys/secrets are server-only (never exposed to the client). Only
  `NEXT_PUBLIC_*` values are sent to the browser.

## Response headers

Baseline headers are set globally in `next.config.ts`: `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS.
