import { NextRequest } from "next/server";
import { chapa } from "@/lib/payments/chapa";
import { processPaymentByTxRef } from "@/lib/payments/service";
import { apiError, json } from "@/lib/api";

/**
 * Chapa webhook. Security:
 *   - 503 if payments are not configured (never silently accept).
 *   - Verify the signature over the RAW body before parsing.
 *   - Re-verify the payment server-side (in the service) — the body is a hint,
 *     not proof.
 *   - Idempotent via WebhookEvent keyed on the tx ref.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!chapa.isConfigured()) {
    return apiError("payments_not_configured", "Payments are not enabled.", 503);
  }

  const raw = await req.text();
  const sig =
    req.headers.get("chapa-signature") ?? req.headers.get("x-chapa-signature");

  if (!chapa.verifyWebhookSignature(raw, sig)) {
    return apiError("invalid_signature", "Webhook signature verification failed.", 401);
  }

  let txRef: string | null = null;
  try {
    const body = JSON.parse(raw);
    txRef = body?.tx_ref ?? body?.data?.tx_ref ?? null;
  } catch {
    txRef = null;
  }
  if (!txRef) {
    return apiError("bad_request", "Missing tx_ref.", 400);
  }

  const result = await processPaymentByTxRef(txRef, `chapa:${txRef}`);
  // Always 200 so the provider stops retrying once we've handled (idempotently).
  return json({ received: true, result: result.reason });
}
