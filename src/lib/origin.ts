/**
 * Origin / allowed-domain validation. The SDK sends the page origin; the
 * backend decides whether that origin is permitted for the project. This runs
 * ONLY on the server — never trust a browser-asserted "allowed" flag.
 */

/**
 * Normalize user input or an origin into a bare host: lowercase, no scheme,
 * no path, no port. Returns null if it cannot be parsed into a host.
 * The literal "*" is preserved as the allow-all wildcard.
 */
export function normalizeDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  if (trimmed === "*") return "*";
  if (trimmed.length === 0) return null;

  let host = trimmed;
  // Strip scheme if present.
  if (host.includes("://")) {
    try {
      host = new URL(host).hostname;
    } catch {
      return null;
    }
  } else {
    // Strip any path/query and port from a bare "host/..:port" form.
    host = host.split("/")[0];
    host = host.split(":")[0];
  }

  host = host.replace(/\.$/, ""); // trailing dot
  if (host.length === 0) return null;
  // Allow a leading wildcard label ("*.example.com").
  const candidate = host.startsWith("*.") ? host.slice(2) : host;
  // Very light structural validation — must contain at least one label char.
  if (!/^[a-z0-9.-]+$/.test(candidate)) return null;
  return host;
}

/** Extract a bare host from a page Origin header value. */
export function hostFromOrigin(origin: string | null | undefined): string | null {
  if (!origin) return null;
  return normalizeDomain(origin);
}

/**
 * Is `origin` permitted given the project's configured domains?
 *   - "*" in the list allows any origin (intended for development only).
 *   - exact host match.
 *   - "*.example.com" matches any subdomain of example.com (but not the apex).
 * localhost / 127.0.0.1 are always allowed so local previews work out of the box.
 */
export function isOriginAllowed(
  origin: string | null | undefined,
  allowedDomains: string[],
): boolean {
  const host = hostFromOrigin(origin);
  if (!host) return false;

  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return true;
  }

  for (const raw of allowedDomains) {
    const allowed = normalizeDomain(raw);
    if (!allowed) continue;
    if (allowed === "*") return true;
    if (allowed === host) return true;
    if (allowed.startsWith("*.")) {
      const base = allowed.slice(2);
      if (host === base) continue; // apex not covered by *.base
      if (host.endsWith(`.${base}`)) return true;
    }
  }
  return false;
}
