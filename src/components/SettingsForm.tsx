"use client";

import { useActionState } from "react";
import { SubmitButton } from "./ui/SubmitButton";
import { emptyState } from "@/lib/action-state";
import { updateSettingsAction } from "@/app/actions/settings";

export function SettingsForm({
  defaults,
}: {
  defaults: {
    name: string;
    defaultPortfolioUrl: string;
    defaultWatermarkText: string;
    defaultWatermarkStyle: string;
  };
}) {
  const [state, action] = useActionState(updateSettingsAction, emptyState);

  return (
    <form action={action} className="card p-5 flex flex-col gap-4">
      {state.ok && state.message ? (
        <div role="status" className="rounded-[var(--radius)] border border-[var(--color-ok-line)] bg-[var(--color-ok-bg)] px-3 py-2 text-sm text-[var(--color-ok)]">
          {state.message}
        </div>
      ) : state.error ? (
        <div role="alert" className="rounded-[var(--radius)] border border-[var(--color-danger-line)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="s-name">Name</label>
        <input id="s-name" name="name" className="field" defaultValue={defaults.name} maxLength={100} />
      </div>
      <div>
        <label className="label" htmlFor="s-portfolio">Default portfolio / contact URL</label>
        <input id="s-portfolio" name="defaultPortfolioUrl" type="url" className="field" defaultValue={defaults.defaultPortfolioUrl} placeholder="https://your-portfolio.example.com" />
        <p className="help">Prefilled into new projects&apos; watermark and preview redirect.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="s-wtext">Default watermark text</label>
          <input id="s-wtext" name="defaultWatermarkText" className="field" defaultValue={defaults.defaultWatermarkText} maxLength={120} />
        </div>
        <div>
          <label className="label" htmlFor="s-wstyle">Default watermark style</label>
          <select id="s-wstyle" name="defaultWatermarkStyle" className="field" defaultValue={defaults.defaultWatermarkStyle}>
            <option value="diagonal">Repeated diagonal</option>
            <option value="center">Large centered</option>
            <option value="layer">Translucent layer</option>
            <option value="banner">Compact banner</option>
          </select>
        </div>
      </div>
      <div>
        <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
      </div>
    </form>
  );
}
