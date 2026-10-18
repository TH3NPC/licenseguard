# LicenseGuard — Security & limitations

This document is deliberately honest about what a client-side SDK can and
cannot do. Overstating protection would be the real security flaw.

## The core honesty

A JavaScript SDK runs in the visitor's browser. Anyone with access to the
site's source can:

- delete or block the `<script>`,
- override the watermark with CSS,
- read the DOM, or
- screenshot the page.

Therefore **the embedded SDK deters casual reuse of unpaid work — it is not
DRM and cannot guarantee protection.** We do not claim otherwise anywhere in
the product or marketing.

## Protection by deployment model

| Model | What's protected | Strength |
|-------|------------------|----------|
| **SDK embedded in a customer's repo/site** | Visual watermark + preview interactions | Deterrent only — removable by anyone with source access |
| **Hosted preview** (server-controlled, future) | The content itself is gated server-side by the license check | Strong — removing client code doesn't reveal content |

If you need real enforcement, serve the preview from a deployment you control
and gate the protected content behind the server-side license check (and/or the
authenticated `/api/v1/verify` endpoint), rather than relying on the script.

## Server-side guarantees (these are real)

- **No secrets in the browser.** The SDK only ever carries a public project id.
  Server API credentials are `lg_sk_…` secrets, stored only as SHA-256 hashes,
  shown once, and rotatable/revocable.
- **License authority is server-side.** The browser cannot assert a license
  status; the server derives the effective status from stored state + the clock.
- **IDOR prevention.** Every tenant-owned query is scoped by `ownerId`. The
  private verify endpoint derives the project from the credential, accepting no
  id from the request.
- **No unauthenticated activation.** Licenses change only through authorized
  server actions or verified payments — never from an open endpoint.
- **Origin validation** on the public endpoint against the project's allowed
  domains (localhost always allowed; `*` and `*.domain` supported).
- **Rate limiting** on public endpoints; **security headers** app-wide
  (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`).
- **Input validation** with zod at every boundary.
- **Payments** (Phase H): webhook signature verification, mandatory server-side
  re-verification before activation, amount/currency/project matching, and
  idempotent handling of duplicate deliveries. Card data is never stored.
- **No dangerous dynamic execution** in the SDK; SVG watermark text is escaped.

## Preview interaction safety

The SDK never intercepts form controls (`input`/`select`/`textarea`/`label`),
`contenteditable`, or elements marked `[data-lg-allow]`. "Strict" mode (which
intercepts all links and buttons) is explicitly opt-in and documented as a
strict preview mode. Payment/auth controls should be marked `[data-lg-allow]`
or excluded via the allow-selector.

## Known limitations

- **In-memory rate limiting** is per-instance. For multi-instance production,
  swap the store in `src/lib/rate-limit.ts` for Vercel KV / Upstash Redis.
- **Session JWTs** are not individually revocable before expiry (7 days). A
  server-side session store would add instant revocation if needed.
- The **Chapa webhook signature scheme** is implemented as real HMAC-SHA256 but
  must be confirmed against your account's current Chapa documentation before
  going live.

## Secret management

- Secrets live only in server-side environment variables. `.env` is gitignored;
  `.env.example` contains placeholders only.
- Use a strong `AUTH_SECRET` in production (`openssl rand -base64 48`).
- Rotate server API credentials by creating a new one and revoking the old.

## Reporting

For a real deployment, add a security contact and a disclosure policy here.
