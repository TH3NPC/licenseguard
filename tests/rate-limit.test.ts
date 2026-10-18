import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, __resetRateLimitStore } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => __resetRateLimitStore());

  it("allows up to the limit then blocks", () => {
    const t0 = 1_000_000;
    expect(rateLimit("k", 3, 1000, t0).allowed).toBe(true);
    expect(rateLimit("k", 3, 1000, t0).allowed).toBe(true);
    const third = rateLimit("k", 3, 1000, t0);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
    expect(rateLimit("k", 3, 1000, t0).allowed).toBe(false);
  });

  it("resets after the window", () => {
    const t0 = 1_000_000;
    rateLimit("k", 1, 1000, t0);
    expect(rateLimit("k", 1, 1000, t0).allowed).toBe(false);
    expect(rateLimit("k", 1, 1000, t0 + 1001).allowed).toBe(true);
  });

  it("tracks separate keys independently", () => {
    const t0 = 2_000_000;
    expect(rateLimit("a", 1, 1000, t0).allowed).toBe(true);
    expect(rateLimit("b", 1, 1000, t0).allowed).toBe(true);
  });
});
