import { NextResponse } from "next/server";

/**
 * Consistent JSON API responses + helpers shared by route handlers. Errors use
 * a stable shape `{ error: { code, message } }` and never leak internals.
 */

export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function apiError(
  code: string,
  message: string,
  status: number,
  extraHeaders?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: extraHeaders },
  );
}

export function rateLimitHeaders(r: {
  limit: number;
  remaining: number;
  resetAt: number;
}): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(Math.ceil(r.resetAt / 1000)),
  };
}

/** Best-effort client IP from standard proxy headers (Vercel sets these). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

/** CORS headers for the public, cross-origin SDK endpoints. */
export const PUBLIC_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function preflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: PUBLIC_CORS_HEADERS });
}
