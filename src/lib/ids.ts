import { randomBytes } from "node:crypto";

/**
 * Identifier + token generation. We use distinct, self-describing prefixes so
 * a public id can never be confused with a secret credential in logs or UIs.
 */

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

/** Public, browser-safe project identifier. NOT a secret. */
export function generatePublicProjectId(): string {
  return `lg_pub_${randomHex(12)}`; // 24 hex chars
}

/**
 * Secret server-side API credential. Shown to the user exactly once.
 * Returns the plaintext secret plus the stored prefix (non-secret) that lets
 * the dashboard show which key is which without revealing the secret.
 */
export function generateApiSecret(): { secret: string; prefix: string } {
  const secret = `lg_sk_${randomHex(20)}`; // 40 hex chars of entropy
  const prefix = secret.slice(0, 12); // e.g. "lg_sk_a1b2c3"
  return { secret, prefix };
}

/** Client-generated payment reference (unique per order). */
export function generateTxRef(): string {
  return `lg_tx_${Date.now().toString(36)}_${randomHex(6)}`;
}
