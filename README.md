# WLABS — Website Laboratory

> We analyze. We design. We elevate.
> Modern websites, engineered to perform.
> Old website → modern MVP website in 48 hours.

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
- Internal agentic workflow engine (`src/modules/agents`, added in a later phase)

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
| `npm run db:seed`   | Run `prisma/seed.ts`                          |

## Project structure

```
src/
  app/
    (marketing)/        Marketing site (Home, Services, Process, Examples,
                         Pricing, FAQ, Contact, legal pages)
    api/                 API routes (lead capture, contact)
  components/
    ui/                  Base UI primitives (button, card, input, ...)
    layout/              Navbar, footer, background effects
    sections/            Marketing page sections
    forms/               Lead capture forms
    visuals/             Score gauges, browser mockups, industry icons
    motion/              Framer Motion helpers
  modules/
    shared/              Brand constants, shared types, audit rubric
    lead-source/         Inbound lead processing, suppression, normalization
    crm/                 Activity/timeline logging
    agents/              Agentic workflow engine (later phase)
    audit-engine/        100-point audit scoring (later phase)
    crawler/             Website capture/crawling (later phase)
    generator/           MVP redesign + preview generation (later phase)
    email-engine/        Pitch email drafting + QC (later phase)
  lib/                  Prisma client, validation schemas, rate limiting, utils
prisma/
  schema.prisma          Database schema (11 models)
  seed.ts                 Seed script
```

## Compliance notes

- The website preview and contact forms only ever **store** inbound requests
  and create/update CRM leads — they never send outbound email directly.
- A `Suppression` list (by normalized email/website) is checked before any
  lead is created, and opt-out requests are honored across the whole pipeline.
- Outbound email drafting (later phase) is **draft-only** and requires manual
  approval before anything is sent.
