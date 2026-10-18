import "server-only";
import { prisma } from "./prisma";

/** UTC day bucket, e.g. "2026-10-18". */
export function utcDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Increment the daily license-check counter for a project. Best-effort: usage
 * tracking must never break a license response.
 */
export async function recordSdkUsage(projectId: string, now: Date = new Date()) {
  const day = utcDay(now);
  try {
    await prisma.sdkUsage.upsert({
      where: { projectId_day: { projectId, day } },
      create: { projectId, day, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch {
    // ignore
  }
}

export async function usageSummaryForOwner(ownerId: string, days = 30) {
  const since = utcDay(new Date(Date.now() - days * 86400000));
  const rows = await prisma.sdkUsage.findMany({
    where: { project: { ownerId }, day: { gte: since } },
    select: { day: true, count: true, projectId: true },
  });
  const total = rows.reduce((n, r) => n + r.count, 0);
  return { total, rows };
}
