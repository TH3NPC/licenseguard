# LicenseGuard

A developer-focused platform for **protecting website previews**, applying
visible **unpaid-project watermarks**, managing **project licenses**, and
(later) **activating** completed sites after verified payment.

> The product name is configurable — change `APP_NAME` in
> [`src/lib/constants.ts`](src/lib/constants.ts).

One deployable Next.js app provides three things:

1. **Dashboard** — register projects, configure watermarks/preview rules,
   manage licenses and server credentials.
2. **Licensing API** — the server that decides every project's license state.
3. **Public SDK** — a `<script>` you drop into any site; it renders a watermark
   and preview restrictions while the project is unpaid, and clears them once
   the license is active.

**License authority is always on the server.** The browser only sends a public
project id and its origin; it never decides licensing.

---

## Quick start (local)

Requires Node 18+ (tested target: Node 24) and npm.

```bash
# 1. Install dependencies
npm install

# 2. Create the local SQLite schema
npm run prisma:push

# 3. (optional) seed a demo account + project
npm run db:seed          # prints login + a public project id

# 4. Run the app
npm run dev              # http://localhost:3000
```

Default seeded login: `dev@licenseguard.test` / `password123`.

### Try the SDK on the example site

1. In the dashboard, open a project and copy its **public id** (or use the one
   the seed printed). Make sure `localhost` is in its **Allowed domains**.
2. Paste the id into [`examples/demo-site/index.html`](examples/demo-site/index.html)
   (`data-project-id`).
3. Serve the demo from localhost: `npx serve examples/demo-site`.
4. Unpaid → you see the watermark + preview rules. Activate the license in the
   dashboard, reload (allow up to ~60s for the SDK cache) → it clears.

---

## Environment variables

Copy [`.env.example`](.env.example) to `.env`. Only placeholders live in the
template; never commit a real `.env`.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes | SQLite file (dev) or Postgres URL (prod) |
| `AUTH_SECRET` | yes | ≥32-char secret for session JWTs (`openssl rand -base64 48`) |
| `NEXT_PUBLIC_APP_URL` | yes | Public base URL; used to build the SDK snippet |
| `CHAPA_SECRET_KEY` | no | Chapa payments (Phase H) |
| `CHAPA_WEBHOOK_SECRET` | no | Chapa webhook signature verification |

---

## Scripts

| Script | Does |
|--------|------|
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (core logic + ownership/IDOR) |
| `npm run prisma:push` | Push schema to the DB (dev) |
| `npm run prisma:migrate` | Create a migration (prod workflow) |
| `npm run db:seed` | Seed demo data |

---

## Deployment (Vercel + Postgres)

1. In `prisma/schema.prisma`, set `datasource.provider = "postgresql"`.
2. Provision Postgres (Vercel Postgres, Neon, Supabase, RDS…).
3. Set env vars in Vercel: `DATABASE_URL`, `AUTH_SECRET`,
   `NEXT_PUBLIC_APP_URL` (your production URL), and Chapa keys if used.
4. Run migrations against prod: `npx prisma migrate deploy`.
5. Deploy. The SDK is served from `/sdk/v1/licenseguard.js` with permissive
   CORS and a short cache (see [`next.config.ts`](next.config.ts)).

**Hosting responsibilities are distinct** (see [ARCHITECTURE.md](ARCHITECTURE.md)):
the dashboard, the licensing API, and the public SDK all ship from this app; a
**customer's own website** that embeds the SDK is deployed separately and is
only as protected as a client script can be (see [SECURITY.md](SECURITY.md)).

### SDK distribution & versioning

The SDK is a **versioned static asset** at `/sdk/v1/licenseguard.js`. Breaking
changes ship under a new path (`/sdk/v2/…`) so existing embeds keep working. A
future npm package can wrap the same source.

---

## Project structure

```
src/
  app/
    (auth)/            login + register
    dashboard/         overview, projects, settings (auth-guarded)
    api/v1/            license (public), verify (private), payments/chapa/webhook
    actions/           server actions (auth, projects, licenses, credentials, settings)
  components/          dashboard + form UI
  lib/                 licensing, auth, session, projects, licenses, credentials,
                       origin, validation, rate-limit, usage, payments/
public/sdk/v1/         the browser SDK
prisma/                schema + seed
tests/                 vitest (pure logic + DB-backed ownership/IDOR)
examples/demo-site/    example client website
```

See [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY.md](SECURITY.md), and
[PROGRESS.md](PROGRESS.md) (current verification status).
