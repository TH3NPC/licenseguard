# LicenseGuard — Architecture

## Components

| Component | Where it runs | Responsibility |
|-----------|---------------|----------------|
| **Dashboard** | This Next.js app (auth required) | Manage projects, licenses, credentials, settings |
| **Licensing API** | This app, `/api/v1/*` | Decide license state; the single source of truth |
| **Public SDK** | This app, static `/sdk/v1/licenseguard.js` | Runs on customer sites; renders watermark/preview |
| **Hosted preview** _(future)_ | This app / server | Strong enforcement by gating content server-side |
| **Customer website** | Deployed by the developer, separately | Embeds the SDK; only as protected as client code allows |

The dashboard, API, and SDK ship together from one deployable unit. A
customer's website is independent infrastructure.

## Data model

```
User 1─* Project 1─1 License
                 1─* ProjectDomain
                 1─* ApiCredential
                 1─* LicenseEvent
                 1─* Payment
                 1─* SdkUsage
User 1─* Subscription
WebhookEvent (idempotency ledger)   AuditLog (account actions)
```

- **Public project id** (`lg_pub_…`) identifies a project to the SDK. It is not
  a secret and may appear in the browser.
- **ApiCredential** (`lg_sk_…`) is a server-only secret, stored as a SHA-256
  hash with a visible non-secret prefix. Shown once at creation; rotatable.
- **License** holds the stored status + activation/expiry. The *effective*
  status is always derived from stored status + the clock (an active license
  past expiry reads as expired).
- Statuses and JSON config blobs are stored as strings for SQLite⇄Postgres
  portability; the application layer (zod) enforces the allowed values.

## Key request flows

### License check (SDK → public API)
1. SDK sends `GET /api/v1/license?projectId=lg_pub_…` with the page `Origin`.
2. Server rate-limits by IP+project, loads the project, validates the origin
   against the project's allowed domains (localhost always allowed; `*` and
   `*.domain` supported).
3. Server derives the effective status and returns the **minimum** payload:
   `{ licensed, status, expiresAt, preview|null, ttl }`. Nothing about the
   owner or revenue is exposed. Usage is counted.
4. SDK renders the licensed experience or the watermark + preview rules. On any
   error it **fails safe** (does nothing) so it never breaks the host page.

### License activation (dashboard, authorized)
Owner-only server action → ownership check → transition check → update license
→ record a `LicenseEvent`. There is **no** unauthenticated endpoint that can
activate a license.

### Payment-driven activation (Phase H)
`webhook → verify signature → re-verify with Chapa server-side → match
amount/currency/project → activate license → record event`, idempotent via
`WebhookEvent`. A browser redirect is never treated as proof of payment.

## Authentication & authorization

- Sessions are signed JWTs (HS256, `jose`) in an httpOnly cookie; resolved
  server-side to a user record.
- Every tenant-owned query is scoped by `ownerId`, which prevents IDOR: a user
  changing a project id in a URL gets `null`/`404`, never another user's data.
- The private `/api/v1/verify` endpoint derives the project from the credential,
  so no project id is accepted from the request at all.

## API endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET/POST | `/api/v1/license` | public (origin-checked) | SDK license state |
| OPTIONS | `/api/v1/license` | public | CORS preflight |
| POST | `/api/v1/verify` | Bearer `lg_sk_…` | Server-to-server status for one project |
| POST | `/api/v1/payments/chapa/webhook` | signature | Idempotent payment activation (Phase H) |

Dashboard mutations use Next.js **server actions** (auth-guarded), not public
routes.

## Licensing strategy

- The SDK is intentionally "dumb": identify + render. All decisions are
  server-side and short-lived (`ttl`, plus a session cache in the SDK).
- Subscription (developer account access) is modeled **separately** from each
  project's commercial license — they expire independently.
