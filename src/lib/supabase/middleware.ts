import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "./config";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Refreshes the Supabase auth session on each request and keeps the session
 * cookie current. Based on the official @supabase/ssr Next.js pattern.
 * A missing setting or a failed refresh must never take the whole site down,
 * so both cases fall through to a plain response.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  if (!supabaseConfigured) return supabaseResponse;

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // Verifies the token (locally, against cached signing keys) and refreshes
    // it when close to expiry. Much cheaper than getUser(), which always calls
    // the Auth server.
    await supabase.auth.getClaims();
  } catch (err) {
    console.error("Supabase session refresh failed:", err);
  }

  return supabaseResponse;
}
