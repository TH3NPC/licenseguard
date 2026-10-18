import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPublicResponse } from "@/lib/licensing";
import { isOriginAllowed, hostFromOrigin } from "@/lib/origin";
import { publicEnv } from "@/lib/env";
import { parsePreviewConfig, parseWatermarkConfig } from "@/lib/validation";
import { recordSdkUsage } from "@/lib/usage";
import { rateLimit } from "@/lib/rate-limit";
import {
  apiError,
  clientIp,
  json,
  preflight,
  PUBLIC_CORS_HEADERS,
  rateLimitHeaders,
} from "@/lib/api";

/**
 * PUBLIC license-status endpoint used by the SDK.
 *
 * Security posture:
 *   - Identified only by the PUBLIC project id (never a secret).
 *   - Origin is validated server-side against the project's allowed domains.
 *   - Returns the minimum the browser needs; nothing about the owner/revenue.
 *   - Effective status is derived on the server from stored state + clock.
 *   - Rate limited per IP+project; CORS open (the SDK runs on third-party sites).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  return handle(req, projectId);
}

export async function POST(req: NextRequest) {
  let projectId: string | null = null;
  try {
    const body = await req.json();
    projectId = typeof body?.projectId === "string" ? body.projectId : null;
  } catch {
    projectId = null;
  }
  return handle(req, projectId);
}

async function handle(req: NextRequest, projectId: string | null) {
  const ip = clientIp(req);

  const rl = rateLimit(`license:${ip}:${projectId ?? "none"}`, 60, 60_000);
  if (!rl.allowed) {
    return apiError("rate_limited", "Too many requests.", 429, {
      ...PUBLIC_CORS_HEADERS,
      ...rateLimitHeaders(rl),
      "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
    });
  }

  if (!projectId || !projectId.startsWith("lg_pub_")) {
    return apiError("invalid_project", "Missing or invalid projectId.", 400, {
      ...PUBLIC_CORS_HEADERS,
    });
  }

  const project = await prisma.project.findUnique({
    where: { publicId: projectId },
    include: { license: true, domains: true },
  });

  if (!project || project.status === "archived") {
    return apiError("not_found", "Unknown project.", 404, {
      ...PUBLIC_CORS_HEADERS,
    });
  }

  // Origin / allowed-domain check. The app's own host is always allowed so the
  // built-in hosted live preview (/preview/[publicId]) works out of the box.
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  const allowed = project.domains.map((d) => d.domain);
  const appHost = hostFromOrigin(publicEnv.appUrl);
  if (appHost) allowed.push(appHost);
  if (!isOriginAllowed(origin, allowed)) {
    // Do not reveal config to unauthorized origins.
    return apiError(
      "origin_not_allowed",
      "This origin is not authorized for the project.",
      403,
      { ...PUBLIC_CORS_HEADERS },
    );
  }

  // A disabled project means the owner turned protection off → no watermark.
  if (project.status === "disabled") {
    void recordSdkUsage(project.id);
    return json(
      {
        projectId: project.publicId,
        licensed: true,
        status: "active",
        expiresAt: null,
        preview: null,
        ttl: 60,
      },
      {
        headers: {
          ...PUBLIC_CORS_HEADERS,
          ...rateLimitHeaders(rl),
          "Cache-Control": "public, max-age=30",
        },
      },
    );
  }

  const watermark = parseWatermarkConfig(project.watermarkConfig);
  const preview = parsePreviewConfig(project.previewConfig);

  const payload = buildPublicResponse({
    publicId: project.publicId,
    license: project.license,
    previewConfig: { watermark, preview },
  });

  void recordSdkUsage(project.id);

  return json(payload, {
    headers: {
      ...PUBLIC_CORS_HEADERS,
      ...rateLimitHeaders(rl),
      "Cache-Control": "public, max-age=30",
    },
  });
}
