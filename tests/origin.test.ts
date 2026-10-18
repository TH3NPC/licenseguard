import { describe, it, expect } from "vitest";
import { normalizeDomain, isOriginAllowed } from "@/lib/origin";

describe("normalizeDomain", () => {
  it("strips scheme, port and path", () => {
    expect(normalizeDomain("https://Example.com:3000/path")).toBe("example.com");
    expect(normalizeDomain("example.com/foo")).toBe("example.com");
    expect(normalizeDomain("example.com:8080")).toBe("example.com");
  });
  it("preserves wildcards", () => {
    expect(normalizeDomain("*")).toBe("*");
    expect(normalizeDomain("*.example.com")).toBe("*.example.com");
  });
  it("rejects empty / invalid", () => {
    expect(normalizeDomain("")).toBeNull();
    expect(normalizeDomain(null)).toBeNull();
    expect(normalizeDomain("   ")).toBeNull();
  });
});

describe("isOriginAllowed", () => {
  it("matches exact hosts", () => {
    expect(isOriginAllowed("https://example.com", ["example.com"])).toBe(true);
    expect(isOriginAllowed("https://other.com", ["example.com"])).toBe(false);
  });
  it("always allows localhost and 127.0.0.1", () => {
    expect(isOriginAllowed("http://localhost:3000", [])).toBe(true);
    expect(isOriginAllowed("http://127.0.0.1:8080", [])).toBe(true);
  });
  it("supports the allow-all wildcard", () => {
    expect(isOriginAllowed("https://anything.com", ["*"])).toBe(true);
  });
  it("supports subdomain wildcards but not the apex", () => {
    expect(isOriginAllowed("https://app.example.com", ["*.example.com"])).toBe(true);
    expect(isOriginAllowed("https://a.b.example.com", ["*.example.com"])).toBe(true);
    expect(isOriginAllowed("https://example.com", ["*.example.com"])).toBe(false);
  });
  it("rejects a missing origin even with a wildcard (no host to validate)", () => {
    expect(isOriginAllowed(null, ["example.com"])).toBe(false);
    expect(isOriginAllowed(undefined, ["*"])).toBe(false);
  });
});
