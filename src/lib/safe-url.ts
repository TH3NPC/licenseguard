/**
 * Guard for server-side fetches of user-supplied URLs (the installation
 * check). Only ordinary public http(s) addresses pass — never localhost,
 * private/link-local IP ranges, or single-label/internal hostnames.
 * Note: hostnames are not resolved here, so DNS that points a public name at a
 * private address is not caught; requests also use a short timeout and capped
 * response size.
 */
export function isPublicHttpUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === "::1" ||
    /^(fc|fd|fe80)/.test(host) ||
    !host.includes(".")
  ) {
    return null;
  }
  return url;
}
