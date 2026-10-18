/**
 * Lightweight in-memory fixed-window rate limiter. Suitable for a single
 * instance / dev and as a first line of defense. For multi-instance production
 * behind Vercel, swap the store for Upstash Redis or Vercel KV (the interface
 * is intentionally small). Documented as a known limitation in SECURITY.md.
 */

interface Counter {
  count: number;
  resetAt: number;
}

const store = new Map<string, Counter>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, limit, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, limit, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    limit,
    resetAt: existing.resetAt,
  };
}

/** Test helper — clears all counters. */
export function __resetRateLimitStore(): void {
  store.clear();
}

// Opportunistic cleanup so the map does not grow unbounded.
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) {
      if (v.resetAt <= now) store.delete(k);
    }
  }, 60_000);
  // Do not keep the event loop alive just for cleanup.
  if (typeof timer.unref === "function") timer.unref();
}
