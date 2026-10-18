"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { startSession, endSession, getCurrentUser } from "@/lib/session";
import { loginSchema, registerSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { ActionState, zodFieldErrors } from "@/lib/action-state";

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: "An account with this email already exists." } };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name || null,
      // First release: every new developer starts with an active monthly
      // subscription so they can create and manage projects immediately.
      subscriptions: {
        create: {
          plan: "developer",
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        },
      },
    },
  });

  await recordAudit({ userId: user.id, action: "account.register" });
  await startSession({ userId: user.id, email: user.email });
  redirect("/dashboard");
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Please enter your email and password." };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  // Constant-ish failure path: run a hash compare even when the user is
  // missing to avoid trivial user-enumeration via timing.
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, "$2a$12$0000000000000000000000000000000000000000000000000000");

  if (!user || !ok) {
    return { error: "Invalid email or password." };
  }

  await recordAudit({ userId: user.id, action: "account.login" });
  await startSession({ userId: user.id, email: user.email });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  if (user) await recordAudit({ userId: user.id, action: "account.logout" });
  await endSession();
  redirect("/login");
}
