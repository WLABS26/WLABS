# WLABS Setup Guide

## Prerequisites

- Node.js 20+ (22 recommended)
- PostgreSQL 14+ (local, Docker, or a hosted provider such as Supabase/Neon)

## 1. Install

```bash
npm install
```

## 2. Environment

```bash
cp .env.example .env
```

The app runs locally with safe defaults — every external integration (AI, email,
deployment, enrichment) is optional. The only thing you must set to use the
database is `DATABASE_URL` (the example default matches a local Postgres of
`wlabs` / `wlabs` / `wlabs` on port 5432).

Key variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | Postgres connection | local wlabs db |
| `AI_PROVIDER` | `mock` \| `openai` \| `anthropic` | `mock` (deterministic, no key) |
| `ADMIN_EMAIL` | Admin login email | `admin@wlabs.co` |
| `ADMIN_PASSWORD_HASH` | sha256(password + email) | — (set via helper) |
| `SESSION_SECRET` | Signs the admin session cookie | change me |
| `NEXT_PUBLIC_APP_URL` | Absolute base URL (preview/email links) | `http://localhost:3000` |
| `BOOKING_URL` | Booking link used in emails | — |

## 3. Database

Start Postgres (Docker example):

```bash
docker compose up -d
```

Push the schema and seed mock data:

```bash
npm run db:push
npm run db:seed
```

The seed creates 16 leads across every industry and pipeline status, plus
suppressions, inbound requests, audits, activity, and workflow runs.

## 4. Create an admin password

```bash
npm run admin:hash -- "your-strong-password"
```

Paste the printed hash into `ADMIN_PASSWORD_HASH` in `.env`.

## 5. Run

```bash
npm run dev          # http://localhost:3000
```

- Marketing site: `/`
- Admin dashboard: `/admin/login` → sign in with `ADMIN_EMAIL` + your password
- Preview concept: generated per lead at `/preview/[slug]?token=...`

## 6. Verify

```bash
npm run lint
npm run build
npm test
```

## Demo flow (golden path)

1. Sign in at `/admin/login`.
2. Open a lead (e.g. **Smith Dental Clinic**) → **Run agent pipeline**
   (qualify → crawl → audit). _Note: seed leads use `example.com` URLs that
   won't crawl; import a lead with a real URL, or use the Workflow center batch._
3. **Generate preview** → open the tokenized preview → **Run QC** → **Approve**.
4. **Draft outreach email** → review QC → **Approve**.
5. **Workflow center** → **Start batch** to process many leads at once.
6. **Analytics** for funnel + revenue; **Emails → Export approved (CSV)**.
