import { createHash, timingSafeEqual } from "node:crypto";
import { generateApiSecret } from "./ids";

/**
 * API credential hashing. Secrets are stored only as SHA-256 hashes; the
 * plaintext is returned once at creation and never persisted. SHA-256 (rather
 * than a slow KDF) is appropriate here because the secret is a 160-bit random
 * token, not a human password — there is nothing to brute force.
 */

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function verifySecret(secret: string, storedHash: string): boolean {
  const a = Buffer.from(hashSecret(secret), "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createCredential(): {
  secret: string;
  prefix: string;
  tokenHash: string;
} {
  const { secret, prefix } = generateApiSecret();
  return { secret, prefix, tokenHash: hashSecret(secret) };
}
