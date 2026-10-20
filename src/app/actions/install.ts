"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isOriginAllowed } from "@/lib/origin";
import { isPublicHttpUrl } from "@/lib/safe-url";
import { ActionState } from "@/lib/action-state";

const MAX_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;

async function fetchPage(start: URL): Promise<{ html: string; finalUrl: URL } | { error: string }> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: { "user-agent": "ZER-installation-check/1.0", accept: "text/html" },
      });
    } catch {
      return { error: `Couldn't reach ${url.hostname}. Is the site deployed and public?` };
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      const next = isPublicHttpUrl(new URL(res.headers.get("location")!, url).toString());
      if (!next) return { error: "The site redirects somewhere that can't be checked." };
      url = next;
      continue;
    }
    if (!res.ok) return { error: `${url.hostname} answered with HTTP ${res.status}.` };

    // Read at most MAX_BYTES of the page.
    const reader = res.body?.getReader();
    if (!reader) return { html: "", finalUrl: url };
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.length;
    }
    await reader.cancel().catch(() => {});
    return { html: new TextDecoder().decode(Buffer.concat(chunks)), finalUrl: url };
  }
  return { error: "The site redirects too many times." };
}

/** Visits the project's website and reports whether the ZER script is installed. */
export async function checkInstallAction(
  projectId: string,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { publicId: true, websiteUrl: true, domains: { select: { domain: true } } },
  });
  if (!project) return { error: "Project not found." };
  if (!project.websiteUrl) {
    return { error: "Add the website address in the Settings tab first, then run the check." };
  }

  const url = isPublicHttpUrl(project.websiteUrl);
  if (!url) return { error: "That website address can't be checked — use a public http(s) address." };

  const page = await fetchPage(url);
  if ("error" in page) return { error: page.error };

  const host = page.finalUrl.hostname;
  const hasSdk = page.html.includes("/sdk/v1/licenseguard.js");
  const hasId = page.html.includes(project.publicId);
  const allowed = isOriginAllowed(
    page.finalUrl.origin,
    project.domains.map((d) => d.domain),
  );

  if (hasSdk && hasId) {
    return allowed
      ? { ok: true, message: `Installed. The script is on ${host} and the domain is allowed — the watermark shows while unpaid.` }
      : {
          error: `The script is on ${host}, but ${host} isn't in Allowed domains, so the watermark won't show. Add it in the Settings tab.`,
        };
  }
  if (hasSdk) {
    return { error: `Found a ZER script on ${host}, but for a different project. Paste this project's script instead.` };
  }
  return {
    error: `No ZER script found on ${host}. Paste the script into the site's <head> and redeploy the site. (Scripts added later by JavaScript can't be seen here — open the site to confirm.)`,
  };
}
