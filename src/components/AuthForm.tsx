"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "./ui/SubmitButton";
import { ActionState, emptyState } from "@/lib/action-state";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "register";
  action: Action;
}) {
  const [state, formAction] = useActionState(action, emptyState);
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error ? (
        <div
          role="alert"
          className="rounded-[var(--radius)] border border-[var(--color-danger-line)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {state.error}
        </div>
      ) : null}

      {state.ok && state.message ? (
        <div
          role="status"
          className="rounded-[var(--radius)] border border-[var(--color-ok-line)] bg-[var(--color-ok-bg)] px-3 py-2 text-sm text-[var(--color-ok)]"
        >
          {state.message}
        </div>
      ) : null}

      {isRegister ? (
        <div>
          <label className="label" htmlFor="name">
            Name <span className="text-[var(--color-subtle)]">(optional)</span>
          </label>
          <input id="name" name="name" className="field" autoComplete="name" />
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="field"
          autoComplete="email"
          aria-invalid={!!state.fieldErrors?.email}
        />
        {state.fieldErrors?.email ? (
          <p className="error-text">{state.fieldErrors.email}</p>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="field"
          autoComplete={isRegister ? "new-password" : "current-password"}
          aria-invalid={!!state.fieldErrors?.password}
        />
        {state.fieldErrors?.password ? (
          <p className="error-text">{state.fieldErrors.password}</p>
        ) : isRegister ? (
          <p className="help">At least 8 characters.</p>
        ) : null}
      </div>

      <SubmitButton pendingText={isRegister ? "Creating account…" : "Signing in…"}>
        {isRegister ? "Create account" : "Sign in"}
      </SubmitButton>

      <p className="text-sm text-[var(--color-muted)]">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium underline underline-offset-2">
              Sign in
            </Link>
          </>
        ) : (
          <>
            No account yet?{" "}
            <Link href="/register" className="font-medium underline underline-offset-2">
              Create one
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
