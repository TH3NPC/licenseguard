"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_NOT_CONFIGURED, supabaseConfigured } from "@/lib/supabase/config";
import { loginSchema, registerSchema } from "@/lib/validation";
import { ActionState, zodFieldErrors } from "@/lib/action-state";

/**
 * Authentication via Supabase Auth. The app's own user/profile row (and all
 * project data) is keyed by the Supabase user id and ensured lazily in
 * getCurrentUser(); see src/lib/session.ts.
 */

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
    return {
      error: "Please fix the errors below.",
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  if (!supabaseConfigured) return { error: SUPABASE_NOT_CONFIGURED };

  const { email, password, name } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: name ? { name } : undefined },
  });

  if (error) {
    return { error: error.message };
  }
  // When email confirmation is enabled, no session is returned yet.
  if (!data.session) {
    return {
      ok: true,
      message:
        "Check your email to confirm your account, then sign in. (You can disable this in Supabase → Auth → Email.)",
    };
  }

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

  if (!supabaseConfigured) return { error: SUPABASE_NOT_CONFIGURED };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Invalid email or password." };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
