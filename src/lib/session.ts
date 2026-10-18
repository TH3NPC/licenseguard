import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

/**
 * Server-side session resolution. Identity comes from Supabase Auth; the app's
 * own profile row (and everything it owns) is keyed by the Supabase user id and
 * ensured here on first use, so the signup/confirm timing never matters.
 * Authorization always starts from this user — never from client input.
 */

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const email = user.email ?? `${user.id}@users.noreply`;

  // Ensure the app profile exists, keyed by the Supabase user id.
  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email,
      name: (user.user_metadata?.name as string | undefined) ?? null,
      subscriptions: {
        create: {
          plan: "developer",
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      defaultPortfolioUrl: true,
      defaultWatermarkText: true,
      defaultWatermarkStyle: true,
      createdAt: true,
    },
  });

  return dbUser;
}

/** Require an authenticated user in a server component / route, else redirect. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
