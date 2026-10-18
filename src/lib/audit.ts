import { prisma } from "./prisma";
import type { LicenseEventType } from "./constants";

/**
 * Audit + license-event recording. Audit logs capture account-level actions;
 * license events capture the lifecycle of a project's commercial license and
 * power the "recent changes" views in the dashboard.
 */

export async function recordAudit(input: {
  userId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  metadata?: unknown;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        ip: input.ip,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch {
    // Audit must never break the main flow.
  }
}

export async function recordLicenseEvent(input: {
  projectId: string;
  type: LicenseEventType;
  fromStatus?: string | null;
  toStatus?: string | null;
  actor: string;
  metadata?: unknown;
}): Promise<void> {
  await prisma.licenseEvent.create({
    data: {
      projectId: input.projectId,
      type: input.type,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      actor: input.actor,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
