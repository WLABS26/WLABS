# WLABS — Website Laboratory

> We analyze. We design. We elevate.
> Modern websites, engineered to perform.
> Old website → modern MVP website in 48 hours.

**New here and not a developer?** Start with the
[Launch guide](docs/launch-guide.md) — get this live in ~15 minutes, no
coding required.

WLABS is an AI-assisted "website factory": it identifies outdated small-business
websites, scores them against a standardized 100-point audit, generates a modern
MVP homepage redesign, and prepares a personalized pitch — with human review at
every key step.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling, **Framer Motion** for animation
- Hand-built **shadcn/ui**-style components (Radix primitives + CVA)
- **PostgreSQL** via **Prisma 7** (driver adapter: `@prisma/adapter-pg`)
- **Zod** for shared client/server validation
- Internal agentic workflow engine (`src/modules/agents`) — no n8n / external tools

## Documentation

- [Launch guide](docs/launch-guide.md) — no-code guide to running this locally or deploying it live
- [Setup guide](docs/setup.md) — install, env, database, admin, golden-path demo
- [Agent system](docs/agents.md) — the Agent contract, runner, agents & pipelines
- [Scoring rubric](docs/scoring-rubric.md) — the 100-point audit framework
- [Deployment](docs/deployment.md) — Vercel, previews, email deliverability
- [Security & compliance](docs/security.md) — auth, SSRF, GDPR/ePrivacy defaults
- [Pitch deck](docs/pitch-deck.md) — investor pitch deck (presentable slideshow: `docs/pitch-deck.html`)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

The app runs locally with sensible defaults — most integrations (AI provider,
email, deployment, enrichment) are optional and default to safe "mock"/no-op
behavior.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

This starts a local Postgres instance matching the default `DATABASE_URL` in
`.env.example` (`wlabs` / `wlabs` / `wlabs` on port `5432`).

### 4. Push the database schema

```bash
npm run db:push
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful scripts

| Command            | Description                                  |
| ------------------ | --------------------------------------------- |
| `npm run dev`       | Start the Next.js dev server (Turbopack)      |
| `npm run build`     | Production build                              |
| `npm run lint`      | Run ESLint                                    |
| `npm run db:generate` | Regenerate the Prisma client                |
| `npm run db:push`   | Push `prisma/schema.prisma` to the database   |
| `npm run db:migrate`| Create/apply a Prisma migration               |
| `npm run db:studio` | Open Prisma Studio                            |
| `npm run db:seed`   | Run `prisma/seed.ts` (mock dataset)           |
| `npm run admin:hash`| Generate an `ADMIN_PASSWORD_HASH`             |
| `npm test`          | Run the unit test suite (node:test)           |

## Project structure

```
src/
  app/
    (marketing)/        Marketing site (Home, Services, Process, Examples,
                         Pricing, FAQ, Contact, legal pages)
    admin/               Admin dashboard (auth, leads, previews, emails,
                         review queue, workflows, analytics)
    preview/[slug]/      Public, token-gated preview homepage renderer
    api/                 API routes (lead capture, contact)
  components/
    ui/                  Base UI primitives (button, card, table, ...)
    admin/               Sidebar, status badges, filters, pagination
    layout/ sections/ forms/ visuals/ motion/   Marketing UI
  modules/
    shared/              Brand constants, shared types, audit rubric
    lead-source/         Inbound lead processing, CSV import, suppression
    crm/                 Leads, dashboard, approvals, analytics, export
    agents/              Agentic workflow engine: base agent, runner, agents,
                         pipelines, batch orchestration
    audit-engine/        100-point deterministic audit scoring
    crawler/             SSRF-safe fetch + metadata extraction
    generator/           Industry templates + preview content/types/store
  lib/                  Prisma client, auth, AI provider, rate limiting, utils
prisma/
  schema.prisma          Database schema (12 models)
  seed.ts                 Seed script (mock dataset)
docs/                    Setup, agents, scoring rubric, deployment, security
tests/                   Unit tests (audit, SSRF, agents, CSV)
```

## Compliance notes

- The website preview and contact forms only ever **store** inbound requests
  and create/update CRM leads — they never send outbound email directly.
- A `Suppression` list (by normalized email/website) is checked before any
  lead is created, and opt-out requests are honored across the whole pipeline.
- Outbound email drafting (later phase) is **draft-only** and requires manual
  approval before anything is sent.
