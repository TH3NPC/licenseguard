import "server-only";
import { prisma } from "../prisma";
import { generateTxRef } from "../ids";
import { recordLicenseEvent } from "../audit";
import { canTransition } from "../licensing";
import { LICENSE_EVENT_TYPE, LICENSE_STATUS, type LicenseStatus } from "../constants";
import { chapa } from "./chapa";
import { PaymentNotConfiguredError } from "./provider";

/**
 * Payment → license activation. The webhook/verify path is the ONLY way a
 * payment activates a license, and it always re-verifies server-side. Duplicate
 * deliveries are idempotent via WebhookEvent + the Payment's own status.
 */

const DEFAULT_LICENSE_DAYS = 30;

export async function createCheckoutForProject(input: {
  publicId: string;
  email: string;
  amount: number;
  currency: string;
  baseUrl: string;
}) {
  if (!chapa.isConfigured()) throw new PaymentNotConfiguredError("chapa");

  const project = await prisma.project.findUnique({
    where: { publicId: input.publicId },
    select: { id: true, status: true },
  });
  if (!project || project.status === "archived") {
    throw new Error("Unknown project.");
  }

  const txRef = generateTxRef();
  await prisma.payment.create({
    data: {
      projectId: project.id,
      provider: "chapa",
      txRef,
      amount: input.amount,
      currency: input.currency,
      status: "pending",
    },
  });

  const session = await chapa.createCheckout({
    amount: input.amount,
    currency: input.currency,
    email: input.email,
    txRef,
    callbackUrl: `${input.baseUrl}/api/v1/payments/chapa/webhook`,
    returnUrl: `${input.baseUrl}/pay/return?tx=${txRef}`,
    metadata: { projectId: project.id },
  });
  return session;
}

/**
 * Idempotently process a (possibly webhook-delivered) payment by re-verifying
 * it server-side. Returns a short result describing what happened.
 */
export async function processPaymentByTxRef(
  txRef: string,
  eventKey: string,
): Promise<{ activated: boolean; reason: string }> {
  // Idempotency: if we already recorded this event, stop.
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { eventKey },
  });
  if (existingEvent && existingEvent.status === "processed") {
    return { activated: false, reason: "duplicate" };
  }

  const payment = await prisma.payment.findUnique({ where: { txRef } });
  if (!payment || !payment.projectId) {
    await markEvent(eventKey, "ignored", { txRef, note: "unknown payment" });
    return { activated: false, reason: "unknown_payment" };
  }
  if (payment.status === "success") {
    await markEvent(eventKey, "processed", { txRef, note: "already success" });
    return { activated: false, reason: "already_processed" };
  }

  // Re-verify server-side — never trust the webhook body.
  const verified = await chapa.verify(txRef);
  if (verified.status !== "success") {
    await prisma.payment.update({
      where: { txRef },
      data: { status: verified.status, rawMeta: JSON.stringify(verified.raw) },
    });
    await markEvent(eventKey, "ignored", { txRef, status: verified.status });
    return { activated: false, reason: `not_success:${verified.status}` };
  }

  // Amount/currency must match what we recorded for THIS project's order.
  if (
    Math.abs(verified.amount - payment.amount) > 0.001 ||
    verified.currency.toUpperCase() !== payment.currency.toUpperCase()
  ) {
    await markEvent(eventKey, "failed", { txRef, note: "amount/currency mismatch" });
    return { activated: false, reason: "amount_mismatch" };
  }

  await prisma.payment.update({
    where: { txRef },
    data: { status: "success", verifiedAt: new Date(), rawMeta: JSON.stringify(verified.raw) },
  });

  await activateLicenseFromPayment(payment.projectId, txRef);
  await markEvent(eventKey, "processed", { txRef });
  return { activated: true, reason: "activated" };
}

async function activateLicenseFromPayment(projectId: string, txRef: string) {
  const license = await prisma.license.findUnique({ where: { projectId } });
  if (!license) return;
  const from = license.status as LicenseStatus;
  if (!canTransition(from, LICENSE_STATUS.ACTIVE)) return;

  const expiresAt = new Date(Date.now() + DEFAULT_LICENSE_DAYS * 86400000);
  await prisma.license.update({
    where: { projectId },
    data: { status: LICENSE_STATUS.ACTIVE, activatedAt: new Date(), expiresAt },
  });
  await recordLicenseEvent({
    projectId,
    type: LICENSE_EVENT_TYPE.ACTIVATED,
    fromStatus: from,
    toStatus: LICENSE_STATUS.ACTIVE,
    actor: `payment:${txRef}`,
    metadata: { expiresAt: expiresAt.toISOString() },
  });
}

async function markEvent(eventKey: string, status: string, payload: unknown) {
  await prisma.webhookEvent.upsert({
    where: { eventKey },
    create: { provider: "chapa", eventKey, status, payload: JSON.stringify(payload), processedAt: new Date() },
    update: { status, processedAt: new Date() },
  });
}
