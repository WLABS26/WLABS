# WLABS Deployment

> Not a developer, or don't have a terminal handy? See the
> [Launch guide](./launch-guide.md) for a click-through Vercel + Neon
> walkthrough that avoids the command line entirely.

## Vercel (recommended)

1. Push the repo and import it into Vercel.
2. Add a Postgres database (Vercel Postgres, Supabase, or Neon) and set
   `DATABASE_URL`. If the provider gives you a **pooled** connection string
   (Neon's has `-pooler` in the host; Supabase uses port `6543`), also set
   `DIRECT_URL` to the matching **direct/non-pooled** string — migrations
   acquire a Postgres advisory lock that doesn't work through a pooler and
   otherwise fail the build with `P1002`. Runtime uses `DATABASE_URL`;
   migrations use `DIRECT_URL` (falling back to `DATABASE_URL` when unset).
3. Set the required environment variables (see `.env.example`). At minimum:
   `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`,
   `NEXT_PUBLIC_APP_URL` (your production URL), plus `DIRECT_URL` when your
   database is pooled (see step 2).
4. The build runs `prisma generate` automatically (postinstall). Apply the
   committed migrations once against the production database:
   ```bash
   npm run db:migrate:deploy
   ```
   (`npm run db:push` also works for quick prototyping, but production
   deployments should use migrations.) No terminal? See
   [Step 4 of the Launch guide](./launch-guide.md#step-4--create-the-database-tables-one-time)
   for a click-through version.
5. Deploy. The marketing site is static; admin and preview routes are dynamic.

## Preview hosting

Previews render dynamically from the database at `/preview/[slug]` and are
gated by a private token. For a public preview subdomain (e.g.
`previews.wlabs.co/smith-dental`), point the subdomain at the same app and map
it to the preview route — no separate deploy per preview is required. Static
HTML export and per-preview deploy adapters are future enhancements.

## Email deliverability checklist

WLABS is **draft-only** — it never sends. When you wire up real sending
(Resend/Postmark/SendGrid via `RESEND_API_KEY` + `EMAIL_FROM`), follow this:

- [ ] Use a dedicated sending domain/subdomain
- [ ] Configure **SPF**, **DKIM**, and **DMARC**
- [ ] Warm up the mailbox; start with low daily volume
- [ ] Verify email addresses before sending
- [ ] Keep bounce and complaint rates low
- [ ] Monitor replies manually; honor opt-outs immediately (suppression list)
- [ ] Never send to purchased lists; business-contact outreach only

## Security & compliance defaults

- Admin dashboard behind a signed session cookie (`src/proxy.ts`).
- Crawler is SSRF-guarded (blocks localhost/private IPs, http(s) only,
  timeout + size cap).
- Public form endpoints are rate-limited and zod-validated.
- Suppression list checked before any lead is created or contacted.
- Baseline security headers set in `next.config.ts`.

See [security.md](./security.md) for the full model.
