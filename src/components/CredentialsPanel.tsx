"use client";

import { useActionState } from "react";
import { SubmitButton } from "./ui/SubmitButton";
import { CopyButton } from "./ui/CopyButton";
import { emptyState } from "@/lib/action-state";
import {
  createCredentialAction,
  revokeCredentialAction,
} from "@/app/actions/credentials";

interface Cred {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export function CredentialsPanel({
  projectId,
  credentials,
}: {
  projectId: string;
  credentials: Cred[];
}) {
  const create = createCredentialAction.bind(null, projectId);
  const [state, action] = useActionState(create, emptyState);
  const secret = (state.data as { secret?: string } | undefined)?.secret;

  return (
    <div className="card p-5">
      <h2 className="box-title">Server API keys</h2>
      <p className="mt-1 text-sm text-[var(--color-subtle)]">
        Secret keys for <strong>server-to-server</strong> use only. Never place
        one in browser code or a public config. They are stored hashed and shown
        once.
      </p>

      {secret ? (
        <div className="mt-4 rounded-[var(--radius)] border border-[var(--color-warn-line)] bg-[var(--color-warn-bg)] p-3">
          <p className="text-sm font-medium text-[var(--color-warn)]">
            Copy this secret now — it will not be shown again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="mono text-xs break-all flex-1">{secret}</code>
            <CopyButton value={secret} />
          </div>
        </div>
      ) : state.error ? (
        <p className="mt-3 error-text">{state.error}</p>
      ) : null}

      {credentials.length > 0 ? (
        <ul className="mt-4 divide-y divide-[var(--color-line)] border-t border-b border-[var(--color-line)]">
          {credentials.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-medium">{c.name}</div>
                <div className="mono text-xs text-[var(--color-subtle)]">
                  {c.prefix}…{" · created "}
                  {new Date(c.createdAt).toLocaleDateString()}
                  {c.lastUsedAt ? ` · last used ${new Date(c.lastUsedAt).toLocaleDateString()}` : " · never used"}
                </div>
              </div>
              <form action={revokeCredentialAction.bind(null, projectId, c.id)}>
                <button type="submit" className="btn btn-danger btn-sm">Revoke</button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[var(--color-subtle)]">No active credentials.</p>
      )}

      <form action={action} className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <label className="label" htmlFor="cred-name">New credential name</label>
          <input id="cred-name" name="name" className="field" placeholder="Server key" maxLength={100} />
        </div>
        <SubmitButton pendingText="Creating…" className="btn btn-secondary">
          Create credential
        </SubmitButton>
      </form>
      <p className="mt-2 text-xs text-[var(--color-subtle)]">
        To rotate, create a new credential and revoke the old one once your
        server is updated.
      </p>
    </div>
  );
}
