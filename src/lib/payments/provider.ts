/**
 * Payment provider abstraction. The billing layer is written against this
 * interface so additional providers can be added later without touching the
 * activation logic. The FIRST release ships the interface + a Chapa client that
 * is INERT until CHAPA_SECRET_KEY is configured — nothing here fakes a payment.
 */

export interface CreateCheckoutInput {
  amount: number;
  currency: string;
  email: string;
  txRef: string;
  callbackUrl: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  checkoutUrl: string;
  txRef: string;
}

export interface VerifiedPayment {
  txRef: string;
  status: "success" | "failed" | "pending";
  amount: number;
  currency: string;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>;
  /** Server-side verification — the ONLY source of truth for activation. */
  verify(txRef: string): Promise<VerifiedPayment>;
  /** Verify a webhook signature against the raw request body. */
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean;
}

export class PaymentNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`Payment provider "${provider}" is not configured.`);
    this.name = "PaymentNotConfiguredError";
  }
}
