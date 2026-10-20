"use client";

import { useActionState } from "react";
import { SubmitButton } from "./ui/SubmitButton";
import { emptyState } from "@/lib/action-state";
import { checkInstallAction } from "@/app/actions/install";

export function InstallCheck({ projectId }: { projectId: string }) {
  const [state, action] = useActionState(checkInstallAction.bind(null, projectId), emptyState);

  return (
    <form action={action} className="space-y-3">
      <SubmitButton pendingText="Checking your site…" className="btn btn-primary btn-sm">
        Check installation
      </SubmitButton>
      {state.ok && state.message ? (
        <p role="status" className="rounded-[var(--radius)] border border-[var(--ok-line)] bg-[var(--ok-bg)] px-3 py-2 text-sm text-[var(--ok)]">
          {state.message}
        </p>
      ) : state.error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-[var(--warn-line)] bg-[var(--warn-bg)] px-3 py-2 text-sm text-[var(--warn)]">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
