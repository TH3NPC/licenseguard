import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { signSession, verifySession, type SessionPayload } from "./auth";

/**
 * Server-only session management: reads/writes the httpOnly session cookie and
 * resolves it to a real user record. Authorization always starts here — never
 * from anything the client asserts.
 */

export const SESSION_COOKIE = "lg_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function startSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

/** Resolve the current authenticated user, or null. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
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
  return user;
}

/** Require an authenticated user in a server component / route, else redirect. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
