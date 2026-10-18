import "server-only";
import { prisma } from "./prisma";
import { generatePublicProjectId } from "./ids";
import { recordLicenseEvent } from "./audit";
import { LICENSE_EVENT_TYPE, LICENSE_STATUS } from "./constants";
import { normalizeDomain } from "./origin";
import type { ProjectCreateInput, ProjectUpdateInput } from "./validation";

/**
 * Project service. EVERY read and write is scoped by ownerId — this is the
 * server-enforced authorization that prevents IDOR. A handler must never query
 * a project by id alone; it goes through these helpers with the session user.
 */

export async function listProjectsForOwner(ownerId: string) {
  return prisma.project.findMany({
    where: { ownerId, status: { not: "archived" } },
    orderBy: { createdAt: "desc" },
    include: {
      license: true,
      _count: { select: { domains: true, credentials: true } },
    },
  });
}

export async function getProjectForOwner(ownerId: string, projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, ownerId },
    include: {
      license: true,
      domains: { orderBy: { createdAt: "asc" } },
      credentials: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          prefix: true,
          status: true,
          lastUsedAt: true,
          createdAt: true,
        },
      },
      licenseEvents: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function createProjectForOwner(
  ownerId: string,
  input: ProjectCreateInput,
) {
  const publicId = generatePublicProjectId();
  const domains = dedupeDomains(input.domains);

  const project = await prisma.project.create({
    data: {
      ownerId,
      publicId,
      name: input.name,
      websiteUrl: input.websiteUrl || null,
      environment: input.environment,
      watermarkConfig: JSON.stringify(input.watermark ?? {}),
      previewConfig: JSON.stringify(input.preview ?? {}),
      domains: { create: domains.map((domain) => ({ domain })) },
      license: {
        create: { status: LICENSE_STATUS.UNPAID_PREVIEW },
      },
    },
    include: { license: true },
  });

  await recordLicenseEvent({
    projectId: project.id,
    type: LICENSE_EVENT_TYPE.CREATED,
    toStatus: LICENSE_STATUS.UNPAID_PREVIEW,
    actor: ownerId,
  });

  return project;
}

export async function updateProjectForOwner(
  ownerId: string,
  projectId: string,
  input: ProjectUpdateInput,
) {
  // Ownership check first.
  const existing = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
    select: { id: true },
  });
  if (!existing) return null;

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.websiteUrl !== undefined) data.websiteUrl = input.websiteUrl || null;
  if (input.environment !== undefined) data.environment = input.environment;
  if (input.status !== undefined) data.status = input.status;
  if (input.watermark !== undefined)
    data.watermarkConfig = JSON.stringify(input.watermark);
  if (input.preview !== undefined)
    data.previewConfig = JSON.stringify(input.preview);

  if (input.domains !== undefined) {
    const domains = dedupeDomains(input.domains);
    await prisma.$transaction([
      prisma.projectDomain.deleteMany({ where: { projectId } }),
      prisma.projectDomain.createMany({
        data: domains.map((domain) => ({ projectId, domain })),
      }),
    ]);
  }

  return prisma.project.update({
    where: { id: projectId },
    data,
    include: { license: true, domains: true },
  });
}

export async function archiveProjectForOwner(
  ownerId: string,
  projectId: string,
) {
  const res = await prisma.project.updateMany({
    where: { id: projectId, ownerId },
    data: { status: "archived" },
  });
  return res.count > 0;
}

function dedupeDomains(raw: string[]): string[] {
  const set = new Set<string>();
  for (const d of raw) {
    const n = normalizeDomain(d);
    if (n) set.add(n);
  }
  return [...set];
}
