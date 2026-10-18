import "server-only";
import { prisma } from "./prisma";
import { recordLicenseEvent } from "./audit";
import { canTransition } from "./licensing";
import { LICENSE_EVENT_TYPE, LICENSE_STATUS, type LicenseStatus } from "./constants";

/**
 * License lifecycle operations. All owner-facing operations are scoped by
 * ownerId. Payment-driven activation is a separate, internal-only path used
 * ONLY after a payment is verified server-side (Phase H).
 */

const EVENT_FOR_STATUS: Record<LicenseStatus, (typeof LICENSE_EVENT_TYPE)[keyof typeof LICENSE_EVENT_TYPE]> = {
  [LICENSE_STATUS.ACTIVE]: LICENSE_EVENT_TYPE.ACTIVATED,
  [LICENSE_STATUS.EXPIRED]: LICENSE_EVENT_TYPE.EXPIRED,
  [LICENSE_STATUS.REVOKED]: LICENSE_EVENT_TYPE.REVOKED,
  [LICENSE_STATUS.SUSPENDED]: LICENSE_EVENT_TYPE.SUSPENDED,
  [LICENSE_STATUS.UNPAID_PREVIEW]: LICENSE_EVENT_TYPE.REINSTATED,
};

export type LicenseChangeResult =
  | { ok: true; status: LicenseStatus }
  | { ok: false; reason: "not_found" | "invalid_transition" };

async function loadOwnedLicense(ownerId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
    include: { license: true },
  });
  if (!project || !project.license) return null;
  return project;
}

export async function setLicenseStatusForOwner(
  ownerId: string,
  projectId: string,
  toStatus: LicenseStatus,
  opts: { expiresAt?: Date | null; note?: string; actor: string },
): Promise<LicenseChangeResult> {
  const project = await loadOwnedLicense(ownerId, projectId);
  if (!project || !project.license) return { ok: false, reason: "not_found" };

  const from = project.license.status as LicenseStatus;
  if (!canTransition(from, toStatus)) {
    return { ok: false, reason: "invalid_transition" };
  }

  const activating = toStatus === LICENSE_STATUS.ACTIVE;
  await prisma.license.update({
    where: { projectId },
    data: {
      status: toStatus,
      activatedAt: activating ? new Date() : project.license.activatedAt,
      expiresAt:
        opts.expiresAt !== undefined ? opts.expiresAt : project.license.expiresAt,
      note: opts.note ?? project.license.note,
    },
  });

  await recordLicenseEvent({
    projectId,
    type: EVENT_FOR_STATUS[toStatus],
    fromStatus: from,
    toStatus,
    actor: opts.actor,
    metadata: opts.expiresAt ? { expiresAt: opts.expiresAt.toISOString() } : undefined,
  });

  return { ok: true, status: toStatus };
}

export function resolveExpiry(input: {
  durationDays?: number;
  expiresAt?: string;
}): Date | null {
  if (input.expiresAt) return new Date(input.expiresAt);
  if (input.durationDays) {
    return new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000);
  }
  return null;
}

export function activateLicenseForOwner(
  ownerId: string,
  projectId: string,
  input: { durationDays?: number; expiresAt?: string; note?: string },
  actor: string,
) {
  return setLicenseStatusForOwner(ownerId, projectId, LICENSE_STATUS.ACTIVE, {
    expiresAt: resolveExpiry(input),
    note: input.note,
    actor,
  });
}

export function revokeLicenseForOwner(
  ownerId: string,
  projectId: string,
  actor: string,
  note?: string,
) {
  return setLicenseStatusForOwner(ownerId, projectId, LICENSE_STATUS.REVOKED, {
    actor,
    note,
  });
}

export function suspendLicenseForOwner(
  ownerId: string,
  projectId: string,
  actor: string,
  note?: string,
) {
  return setLicenseStatusForOwner(ownerId, projectId, LICENSE_STATUS.SUSPENDED, {
    actor,
    note,
  });
}
