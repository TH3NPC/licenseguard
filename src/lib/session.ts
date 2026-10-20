import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { createClient } from "./supabase/server";
import { SUPABASE_NOT_CONFIGURED, supabaseConfigured } from "./supabase/config";

/**
 * Server-side session resolution. Identity comes from Supabase Auth; the app's
 * own profile row (and everything it owns) is keyed by the Supabase user id.
 * Authorization always starts from this user — never from client input.
 *
 * Performance: wrapped in React cache() so the layout and page share one
 * lookup per request; identity is verified with getClaims() (local signature
 * check, no Auth round trip); the profile is read with a single query and only
 * created on the first visit.
 */

const userSelect = {
  id: true,
  email: true,
  name: true,
  defaultPortfolioUrl: true,
  defaultWatermarkText: true,
  defaultWatermarkStyle: true,
  createdAt: true,
} as const;

export const getCurrentUser = cache(async () => {
  // Without Supabase settings nobody can be signed in; render pages as logged out.
  if (!supabaseConfigured) {
    console.error(SUPABASE_NOT_CONFIGURED);
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const id = claims.sub;
  const existing = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (existing) return existing;

  // First visit: create the profile. A concurrent request may win the race,
  // in which case the unique violation is harmless — just read it back.
  try {
    return await prisma.user.create({
      data: {
        id,
        email: (claims.email as string | undefined) ?? `${id}@users.noreply`,
        name: ((claims.user_metadata as { name?: string } | undefined)?.name) ?? null,
        subscriptions: {
          create: {
            plan: "developer",
            status: "active",
            currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
          },
        },
      },
      select: userSelect,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return prisma.user.findUnique({ where: { id }, select: userSelect });
    }
    throw e;
  }
});

/** Require an authenticated user in a server component / route, else redirect. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
