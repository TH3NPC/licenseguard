import { describe, it, expect } from "vitest";
import { hashSecret, verifySecret, createCredential } from "@/lib/credentials";

describe("credential hashing", () => {
  it("hashes deterministically", () => {
    expect(hashSecret("lg_sk_abc")).toBe(hashSecret("lg_sk_abc"));
    expect(hashSecret("lg_sk_abc")).not.toBe(hashSecret("lg_sk_xyz"));
  });
  it("verifies correct and rejects wrong secrets", () => {
    const h = hashSecret("lg_sk_secret");
    expect(verifySecret("lg_sk_secret", h)).toBe(true);
    expect(verifySecret("lg_sk_wrong", h)).toBe(false);
  });
  it("rejects mismatched-length comparisons safely", () => {
    expect(verifySecret("x", "deadbeef")).toBe(false);
  });
  it("createCredential returns a prefixed secret and matching hash", () => {
    const c = createCredential();
    expect(c.secret.startsWith("lg_sk_")).toBe(true);
    expect(c.prefix).toBe(c.secret.slice(0, 12));
    expect(verifySecret(c.secret, c.tokenHash)).toBe(true);
  });
  it("generates unique secrets", () => {
    expect(createCredential().secret).not.toBe(createCredential().secret);
  });
});
