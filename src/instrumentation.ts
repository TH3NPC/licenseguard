/**
 * Runs once when the Node server starts. Prefer IPv4 DNS results so server-side
 * fetch() (Supabase Auth, payment providers, etc.) works on IPv4-only networks
 * where Node would otherwise try an unreachable IPv6 address first.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
