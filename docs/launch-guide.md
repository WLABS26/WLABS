# Launch Guide (No Coding Experience Needed)

This guide is for the WLABS founder/operator — not developers. It explains,
in plain language, how to turn the code in this repository into something
you can click around in a browser: either on your own computer, or as a real
website on the internet.

## What you have right now

All the WLABS code — the marketing site, the admin dashboard, and the AI
agents — is saved in your GitHub repository (`wlabs26/wlabs`). Code by
itself is just files; it needs to be "run" somewhere before it becomes a
website you can visit. There are two ways to do that:

| | Run locally | Deploy live (recommended) |
|---|---|---|
| What you get | A copy running on **your computer only**, at `http://localhost:3000` | A real website with its own URL, reachable from any browser |
| Who can see it | Just you, on that computer | Anyone with the link |
| What it needs | Installing a few free developer tools | Free Vercel + Neon accounts — no installs |
| Time | ~20–30 minutes | ~15 minutes |
| Best for | Testing/tinkering before going live | Showing it to others, real outreach |

Want a real, shareable link? Go to **Part 1**. Want to try it on a computer
first? Skip to **Part 2**.

## Part 1 — Go live in ~15 minutes (Vercel + Neon)

You'll need two free accounts. Both let you sign up with your GitHub
account, so there's no new password to remember for them.

### Step 1 — Create a database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up (the free tier is enough
   to start).
2. Create a new project — any name/region is fine.
3. On the project dashboard, copy the **connection string**. It looks like
   `postgresql://user:password@host/dbname?sslmode=require`. You'll paste
   this into Vercel in Step 3.

### Step 2 — Generate your admin login

Open [`tools/admin-credentials.html`](../tools/admin-credentials.html) in any
browser. To get this file without installing anything: on GitHub, click the
green **Code** button → **Download ZIP**, unzip it, then double-click
`tools/admin-credentials.html`.

Pick an email and a password, click **Generate credentials**, and keep that
tab open — you'll copy three values from it in the next step.

### Step 3 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / log in with GitHub.
2. Click **Add New → Project**, then **Import** the `wlabs26/wlabs`
   repository.
3. Before clicking **Deploy**, find the **Environment Variables** section —
   it's below the Build/Output/Install Command settings, and may be
   collapsed (click it to expand). For each row below, type the **Name**
   into the "Key" box and the value into the box next to it, then click
   **Add More** to add a row for the next one:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the connection string from Neon (Step 1) |
   | `ADMIN_EMAIL` | the email from the credentials tool (Step 2) |
   | `ADMIN_PASSWORD_HASH` | the `ADMIN_PASSWORD_HASH` value from the credentials tool |
   | `SESSION_SECRET` | the `SESSION_SECRET` value from the credentials tool |
   | `NEXT_PUBLIC_APP_URL` | your Vercel URL, e.g. `https://your-project.vercel.app` (fill in after the first deploy, then redeploy once) |

   Everything else is optional — the app ships with safe defaults for the AI
   provider, email, and enrichment integrations.

4. Click **Deploy** and wait for the build to finish.

### Step 4 — Create the database tables (one-time)

The database starts out empty — its tables need to be created once. Without
opening a terminal:

1. In your Vercel project, go to **Settings → Build and Deployment**.
2. Temporarily change the **Build Command** to:
   ```
   npx prisma migrate deploy && npm run build
   ```
3. Go to **Deployments**, open the latest one, and choose **Redeploy**. If
   you're asked about the build cache, choose to redeploy **without** the
   existing cache.
4. Once it finishes successfully, go back to **Build and Deployment** and
   clear the Build Command override so future deploys go back to the default
   (`npm run build`).

_(If you're comfortable with a terminal, this is just `npm run db:migrate:deploy` —
see [setup.md](./setup.md).)_

**If the build fails:** open the failed deployment, expand **Build Logs**,
type `error` into the **Find in logs** box, and read the line(s) it jumps to.
The most common cause is `DATABASE_URL` not being set for the **Production**
environment — go to **Settings → Environment Variables**, open
`DATABASE_URL`, confirm the **Production** checkbox is enabled, and that the
value matches the connection string from Neon's **Connection Details**
exactly (starts with `postgresql://`, ends with `?sslmode=require`).

> **Seeing "A server error has occurred" on `/admin`?** That means Step 4
> hasn't been completed yet — the database has no tables. Complete Step 4
> above, then reload the page.

### Step 5 — You're live

Visit your Vercel URL:

- `/` — the public marketing site
- `/admin/login` — sign in with the email + password from Step 2
- `/preview/[slug]` — generated previews appear here once you create them
  from the admin dashboard

> **Note:** the database starts empty — there are no leads yet. From
> `/admin`, use the lead import to add your first prospects. To load the
> 16-lead sample dataset instead, run `npm run db:seed` once from a terminal
> against your Neon database (optional — see [setup.md](./setup.md)).

## Part 2 — Run it on your own computer (optional)

This is mainly useful for testing before going live, or if you'd rather not
deploy yet. It needs a few free developer tools installed first:

1. [Node.js](https://nodejs.org) (LTS version)
2. [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the
   local database) — or use a free Neon database instead, same as Part 1
3. [GitHub Desktop](https://desktop.github.com/) (to get the code without the
   command line) or `git`

Then follow [setup.md](./setup.md) — it lists the exact commands to copy and
paste into a terminal.

## A guided tour, once it's running

- **Marketing site** (`/`) — the public WLABS site: services, pricing,
  process, FAQ, contact form.
- **Admin dashboard** (`/admin`, behind login):
  - **Leads** — every prospect business and its pipeline status
  - Open a lead → **Run agent pipeline** to qualify it, crawl its website,
    and audit it (scored out of 100)
  - **Generate preview** → creates the AI-redesigned homepage concept,
    viewable at a private `/preview/...` link
  - **Draft outreach email** → writes a personalized email referencing the
    audit and the preview link — always saved as a draft, never sent
    automatically
  - **Workflow center** — run the steps above for many leads at once
  - **Review queue** — everything waiting for your approval
  - **Analytics** — funnel numbers and pipeline value
  - **Emails → Export** — download approved emails as a CSV to send manually

## Updating your admin password later

Reopen `tools/admin-credentials.html`, generate a new
`ADMIN_PASSWORD_HASH`, and update it in your hosting provider's environment
variables, then redeploy.
