# LicenseGuard — Progress report

_Last updated: 2026-10-18_

## ⚠️ Verification status (read this first)

All code below is **written but NOT yet executed or verified**, because
`npm install` is blocked by an extremely slow network on this machine
(measured **6–8 minutes per registry request**; a full install would take many
hours). Until dependencies are installed, **no** build, type-check, lint, test,
or database migration has been run. Do not treat any feature as "verified" yet.

**To finish verification (one-time, needs a usable network):**

```bash
npm install            # resumes from cache; fastest on a normal connection
npm run prisma:push    # create the SQLite dev schema
npm run db:seed        # demo account + project (prints a public id)
npm run typecheck      # expect to fix a few type nits on first real run
npm test               # core licensing + ownership/IDOR tests
npm run dev            # http://localhost:3000
```

If any step fails, fix forward — the failures will be ordinary first-run
integration issues (import paths, Prisma client generation, Tailwind v4), not
design problems. Report real results here afterward.

## Phase status

| Phase | Area | State |
|-------|------|-------|
| 0 | Discovery, skills, architecture plan | ✅ Done |
| A | Workspace + stack confirmed (Next 16, Prisma, self-hosted auth) | ✅ Done |
| B | Foundation: schema, design system, auth, ownership | ✅ Code complete, unverified |
| C | Dashboard: overview, projects, license, integration, settings | ✅ Code complete, unverified |
| D | Licensing API `/api/v1/license` + `/api/v1/verify` | ✅ Code complete, unverified |
| E | Reusable SDK + watermark + preview rules + example site | ✅ Code complete, unverified |
| F | Verification (run tests/build) | ⛔ Blocked on install |
| G | Deployment prep (docs written; not deployed) | ◻️ Docs done |
| H | Chapa payments | ◻️ Architecture + webhook/verify done; checkout UI pending |

## What is implemented

- **Data model** (`prisma/schema.prisma`): User, Project, ProjectDomain,
  License, LicenseEvent, ApiCredential, Subscription, Payment, WebhookEvent,
  AuditLog, SdkUsage. SQLite for dev, portable to Postgres.
- **Auth**: email+password (bcrypt), signed-JWT session cookie (jose),
  server-only session resolution, register/login/logout server actions.
- **Ownership**: every project read/write scoped by `ownerId` (IDOR-safe).
- **Licensing core** (`src/lib/licensing.ts`): effective-status derivation,
  transition rules, minimal public response. Pure + unit-tested.
- **Public API** `GET/POST /api/v1/license`: origin validation, rate limiting,
  usage tracking, minimal payload, CORS for third-party sites.
- **Private API** `POST /api/v1/verify`: Bearer secret → one project's status.
- **SDK** (`public/sdk/v1/licenseguard.js`): auto-init, timeout, session cache,
  duplicate-init guard, 4 watermark styles, 4 preview interaction modes,
  fail-safe on errors, `LicenseGuard.init/destroy`.
- **Dashboard**: overview (real metrics), projects list, create/edit project,
  license activate/revoke/suspend, integration snippet + troubleshooting,
  server API credentials (create/revoke, one-time secret), settings.
- **Payments boundary** (Phase H): provider interface, Chapa client (real
  endpoints, inert without keys), idempotent webhook that re-verifies
  server-side before activating. No fake success anywhere.
- **Tests**: `tests/` — licensing, origin, credentials, rate-limit, validation
  (pure) + `tests/integration/ownership.test.ts` (DB-backed ownership/IDOR/
  credential lifecycle).
- **Example site**: `examples/demo-site/index.html`.

## Key architectural decisions

1. **Prisma + self-hosted auth instead of Supabase** for the first release, so
   the whole system runs and is testable locally with zero external accounts.
   The data layer is abstracted; Supabase/Postgres RLS can replace app-layer
   ownership later. (Flagged to Yakob; switch available on request.)
2. **SDK served as a static versioned asset** (`/sdk/v1/…`) rather than an npm
   package for v1 — simplest integration, cacheable, no build step. An npm
   package can wrap the same source later.
3. **License authority is 100% server-side**; the browser only ever sends a
   public id + origin and renders what the server returns.

## Outstanding / next steps (in order)

1. **Run the install on a usable network** and complete Phase F verification.
2. Fix any first-run type/integration errors; record results here.
3. Phase H: add the checkout initiation route + a minimal payment page that
   calls `createCheckoutForProject`, once Chapa keys are available.
4. Harden rate limiting for multi-instance prod (swap in Vercel KV/Upstash).
5. Optional: hosted-preview deployment model for strong enforcement.

## External setup still required from Yakob

- A usable network to complete `npm install` (the current blocker).
- For production: a Postgres database URL + change the Prisma `provider`.
- For payments: `CHAPA_SECRET_KEY` and `CHAPA_WEBHOOK_SECRET`.
- A strong `AUTH_SECRET` in production (`openssl rand -base64 48`).
