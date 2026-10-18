import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "../env";
import {
  CheckoutSession,
  CreateCheckoutInput,
  PaymentNotConfiguredError,
  PaymentProvider,
  VerifiedPayment,
} from "./provider";

/**
 * Chapa payment client. Uses Chapa's official REST endpoints:
 *   - initialize: POST https://api.chapa.co/v1/transaction/initialize
 *   - verify:     GET  https://api.chapa.co/v1/transaction/verify/{tx_ref}
 *
 * It is INERT until CHAPA_SECRET_KEY is set — every network method throws
 * PaymentNotConfiguredError so the rest of the system cannot accidentally
 * behave as though payments work. No success is ever fabricated.
 *
 * NOTE: the webhook signature scheme below (HMAC-SHA256 of the raw body with
 * CHAPA_WEBHOOK_SECRET, compared to the `Chapa-Signature` / `x-chapa-signature`
 * header) must be confirmed against Chapa's current documentation for your
 * account before relying on it in production. It is implemented as real crypto,
 * not a stub, but the exact header/secret pairing is provider-version specific.
 */

const BASE = "https://api.chapa.co/v1";

export class ChapaProvider implements PaymentProvider {
  readonly name = "chapa";

  isConfigured(): boolean {
    return !!serverEnv.chapaSecretKey;
  }

  private key(): string {
    const k = serverEnv.chapaSecretKey;
    if (!k) throw new PaymentNotConfiguredError(this.name);
    return k;
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const res = await fetch(`${BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.key()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        email: input.email,
        tx_ref: input.txRef,
        callback_url: input.callbackUrl,
        return_url: input.returnUrl,
        "customization[title]": "LicenseGuard",
        meta: input.metadata ?? {},
      }),
    });
    const body = await res.json();
    if (!res.ok || body?.status !== "success" || !body?.data?.checkout_url) {
      throw new Error(`Chapa initialize failed: ${JSON.stringify(body)}`);
    }
    return { checkoutUrl: body.data.checkout_url, txRef: input.txRef };
  }

  async verify(txRef: string): Promise<VerifiedPayment> {
    const res = await fetch(
      `${BASE}/transaction/verify/${encodeURIComponent(txRef)}`,
      { headers: { Authorization: `Bearer ${this.key()}` } },
    );
    const body = await res.json();
    const d = body?.data ?? {};
    const status: VerifiedPayment["status"] =
      body?.status === "success" && d?.status === "success"
        ? "success"
        : d?.status === "failed"
          ? "failed"
          : "pending";
    return {
      txRef,
      status,
      amount: Number(d?.amount ?? 0),
      currency: String(d?.currency ?? ""),
      raw: body,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    const secret = serverEnv.chapaWebhookSecret;
    if (!secret || !signature) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    try {
      const a = Buffer.from(expected);
      const b = Buffer.from(signature);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
}

export const chapa = new ChapaProvider();
