import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, the public SDK, and the public
     * licensing API (those are cross-origin and need no session).
     */
    "/((?!_next/static|_next/image|favicon.ico|sdk/|api/v1/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
