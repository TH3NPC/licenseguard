import "server-only";
import { headers } from "next/headers";
import { publicEnv } from "./env";

/**
 * The public base URL of this ZER deployment, taken from the request itself
 * (the address the dashboard is actually being served from). This keeps
 * generated snippets correct even when NEXT_PUBLIC_APP_URL is stale or points
 * at an old deployment. Falls back to NEXT_PUBLIC_APP_URL outside a request.
 */
export async function getAppBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = (h.get("x-forwarded-host") ?? h.get("host"))?.split(",")[0].trim();
    if (host) {
      const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
      const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() ?? (local ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // Not in a request scope (e.g. build time) — use the configured value.
  }
  return publicEnv.appUrl.replace(/\/$/, "");
}
