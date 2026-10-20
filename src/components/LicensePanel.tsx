"use client";

import { useActionState } from "react";
import { SubmitButton } from "./ui/SubmitButton";
import { StatusBadge } from "./ui/StatusBadge";
import { emptyState } from "@/lib/action-state";
import {
  activateLicenseAction,
  revokeLicenseAction,
  suspendLicenseAction,
} from "@/app/actions/licenses";

export function LicensePanel({
  projectId,
  effective,
  storedStatus,
  activatedAt,
  expiresAt,
  note,
}: {
  projectId: string;
  effective: string;
  storedStatus: string;
  activatedAt: string | null;
  expiresAt: string | null;
  note: string | null;
}) {
  const activate = activateLicenseAction.bind(null, projectId);
  const [state, action] = useActionState(activate, emptyState);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="box-title">License</h2>
        <StatusBadge status={effective} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-[var(--color-subtle)]">Stored status</dt>
        <dd className="text-right">{storedStatus}</dd>
        <dt className="text-[var(--color-subtle)]">Activated</dt>
        <dd className="text-right">{activatedAt ? new Date(activatedAt).toLocaleString() : "—"}</dd>
        <dt className="text-[var(--color-subtle)]">Expires</dt>
        <dd className="text-right">{expiresAt ? new Date(expiresAt).toLocaleString() : "—"}</dd>
        {note ? (
          <>
            <dt className="text-[var(--color-subtle)]">Note</dt>
            <dd className="text-right">{note}</dd>
          </>
        ) : null}
      </dl>

      {state.error ? (
        <p className="mt-3 error-text">{state.error}</p>
      ) : state.ok && state.message ? (
        <p className="mt-3 text-sm text-[var(--color-ok)]">{state.message}</p>
      ) : null}

      <form action={action} className="mt-4 flex flex-wrap items-end gap-3 border-t border-[var(--color-line)] pt-4">
        <div>
          <label className="label" htmlFor="durationDays">Duration (days)</label>
          <input
            id="durationDays"
            name="durationDays"
            type="number"
            min={1}
            max={3650}
            defaultValue={30}
            className="field w-28"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="label" htmlFor="note">Note (optional)</label>
          <input id="note" name="note" className="field" maxLength={500} placeholder="e.g. Paid invoice #1024" />
        </div>
        <SubmitButton pendingText="Activating…">Activate / renew</SubmitButton>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={suspendLicenseAction.bind(null, projectId)}>
          <button type="submit" className="btn btn-secondary btn-sm">Suspend</button>
        </form>
        <form action={revokeLicenseAction.bind(null, projectId)}>
          <button type="submit" className="btn btn-danger btn-sm">Revoke</button>
        </form>
      </div>
      <p className="mt-2 text-xs text-[var(--color-subtle)]">
        Activation and revocation are administrative actions, authorized
        server-side. The effective status is derived from the clock — an active
        license past its expiry reads as expired.
      </p>
    </div>
  );
}
