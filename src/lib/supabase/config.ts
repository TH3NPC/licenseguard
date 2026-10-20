/**
 * Supabase settings. NEXT_PUBLIC_* values are inlined at build time, so after
 * adding them on Vercel the app must be redeployed for them to take effect.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

export const SUPABASE_NOT_CONFIGURED =
  "Sign-in isn't configured: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing. Add them in Vercel and redeploy.";
