import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiSecret } from "@/lib/api-credentials";
import { effectiveStatus, isLicensedStatus } from "@/lib/licensing";
import { rateLimit } from "@/lib/rate-limit";
import { apiError, clientIp, json, rateLimitHeaders } from "@/lib/api";

/**
 * PRIVATE server-to-server license verification.
 *
 * Authenticated with a secret API credential via `Authorization: Bearer lg_sk_…`.
 * Intended for a trusted backend that wants to gate its own protected content
 * on license state (stronger than a client script). Returns richer detail than
 * the public endpoint because the caller is authenticated and scoped to exactly
 * one project (its credential's project) — no project id is accepted from the
 * request, which structurally prevents cross-project (IDOR) access.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = rateLimit(`verify:${ip}`, 120, 60_000);
  if (!rl.allowed) {
    return apiError("rate_limited", "Too many requests.", 429, rateLimitHeaders(rl));
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const cred = await authenticateApiSecret(token);
  if (!cred) {
    return apiError("unauthorized", "Invalid or missing API credential.", 401);
  }

  const project = await prisma.project.findUnique({
    where: { id: cred.projectId },
    include: { license: true },
  });
  if (!project) {
    return apiError("not_found", "Project not found.", 404);
  }

  const status = effectiveStatus(project.license, new Date());
  return json(
    {
      projectId: project.publicId,
      name: project.name,
      status,
      licensed: isLicensedStatus(status),
      activatedAt: project.license?.activatedAt?.toISOString() ?? null,
      expiresAt: project.license?.expiresAt?.toISOString() ?? null,
    },
    { headers: rateLimitHeaders(rl) },
  );
}
