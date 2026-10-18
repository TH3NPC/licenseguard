# Deploying LicenseGuard to Vercel + Postgres

This gets the dashboard, licensing API, and SDK online. Local dev stays on
SQLite; production automatically uses PostgreSQL (the build swaps the Prisma
provider — see `scripts/use-postgres.mjs`). The same schema works on both.

## What you need to create (only you can do these)

1. A **GitHub account + repo** (Vercel deploys from Git).
2. A **Vercel account** (free): https://vercel.com/signup — sign in with GitHub.
3. A **PostgreSQL database** — easiest is **Vercel Postgres** (created from the
   Vercel dashboard; it wires up the env var for you). Neon or Supabase Postgres
   also work — you just paste their connection string.

## Step 1 — Push the code to GitHub

A git repo with an initial commit already exists in this project. Create an
empty repo on GitHub (no README), then:

```bash
git remote add origin https://github.com/<you>/licenseguard.git
git branch -M main
git push -u origin main
```

## Step 2 — Import the project into Vercel

1. Vercel dashboard → **Add New… → Project** → import your GitHub repo.
2. Framework is auto-detected (Next.js). Leave the build settings — `vercel.json`
   already sets the build command to `npm run vercel-build`.
3. Don't deploy yet — set env vars first (next step), or deploy once, add vars,
   and redeploy.

## Step 3 — Provision Postgres

**Option A — Vercel Postgres (recommended):**
Project → **Storage → Create Database → Postgres** → connect it to the project.
Vercel adds `POSTGRES_*` env vars automatically, including a pooled
`POSTGRES_PRISMA_URL`. Set `DATABASE_URL` to that value (Step 4).

**Option B — Neon / Supabase:**
Create a database, copy the **pooled** connection string (ends with
`?sslmode=require`; for Supabase use the connection-pooler URI). Use it as
`DATABASE_URL`.

## Step 4 — Set environment variables (Vercel → Settings → Environment Variables)

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Postgres pooled connection string (or `$POSTGRES_PRISMA_URL`) |
| `AUTH_SECRET` | A long random secret — generate with `openssl rand -base64 48` |
| `NEXT_PUBLIC_APP_URL` | Your production URL, e.g. `https://licenseguard.vercel.app` |
| `CHAPA_SECRET_KEY` | (optional) only when enabling payments |
| `CHAPA_WEBHOOK_SECRET` | (optional) only when enabling payments |

Set them for **Production** (and Preview if you want preview deploys to work).

## Step 5 — Deploy

Trigger a deploy (push to `main`, or click **Redeploy**). The build runs:

```
use-postgres.mjs  →  prisma generate  →  prisma db push  →  next build
```

`prisma db push` creates the tables on the first deploy. On later deploys it
syncs additive changes and safely refuses destructive ones (fix those with a
migration — see below).

## Step 6 — Create your account & verify

1. Open your production URL → **Create account** → you're in the dashboard.
   (The demo seed is NOT run in production; you start clean.)
2. Create a project, add your real client domain to **Allowed domains**, copy
   the integration snippet (it will use your production URL automatically via
   `NEXT_PUBLIC_APP_URL`), and paste it into the client site.

## Notes

- **SDK + CORS:** the SDK is served from `/sdk/v1/licenseguard.js` with open
  CORS and a short cache (see `next.config.ts`), so it works from any client
  site. No extra config needed.
- **Custom domain:** add it in Vercel → Settings → Domains, then update
  `NEXT_PUBLIC_APP_URL` to match and redeploy (so new snippets use it).
- **Schema changes later (migrations):** for controlled production changes,
  switch from `db push` to migrations: run `npx prisma migrate dev` locally
  (against a Postgres dev DB) to create migration files, commit them, and change
  the build to `prisma migrate deploy`. `db push` is fine for the first release.
- **Rate limiting:** the in-memory limiter is per-instance. For serious traffic,
  swap `src/lib/rate-limit.ts` for Vercel KV / Upstash (see SECURITY.md).
- **Rollback:** Vercel keeps every deployment — use **Instant Rollback** in the
  dashboard to revert.
