"use client";

import { useActionState } from "react";
import { SubmitButton } from "./ui/SubmitButton";
import { ActionState, emptyState } from "@/lib/action-state";
import type { WatermarkConfig, PreviewConfig } from "@/lib/validation";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

export interface ProjectFormDefaults {
  name?: string;
  websiteUrl?: string;
  environment?: string;
  domains?: string[];
  watermark?: Partial<WatermarkConfig>;
  preview?: Partial<PreviewConfig>;
}

export function ProjectForm({
  action,
  mode,
  defaults = {},
}: {
  action: Action;
  mode: "create" | "edit";
  defaults?: ProjectFormDefaults;
}) {
  const [state, formAction] = useActionState(action, emptyState);
  const wm = defaults.watermark ?? {};
  const pv = defaults.preview ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? (
        <Banner tone="danger">{state.error}</Banner>
      ) : null}
      {state.ok && state.message ? (
        <Banner tone="ok">{state.message}</Banner>
      ) : null}

      <Section title="Project">
        <Field label="Name" error={state.fieldErrors?.name}>
          <input name="name" className="field" required defaultValue={defaults.name} />
        </Field>
        <Field label="Website URL" hint="Optional. The site you are building." error={state.fieldErrors?.websiteUrl}>
          <input name="websiteUrl" type="url" className="field" placeholder="https://client.example.com" defaultValue={defaults.websiteUrl} />
        </Field>
        <Field label="Environment">
          <select name="environment" className="field" defaultValue={defaults.environment ?? "development"}>
            <option value="development">Development</option>
            <option value="production">Production</option>
          </select>
        </Field>
      </Section>

      <Section
        title="Allowed domains"
        desc="One per line. The license check only serves this project to these origins. localhost is always allowed. Use * only for development."
      >
        <textarea
          name="domains"
          className="field font-mono text-sm"
          rows={4}
          placeholder={"client.example.com\n*.staging.example.com"}
          defaultValue={(defaults.domains ?? []).join("\n")}
        />
      </Section>

      <Section title="Watermark" desc="Shown while the project is unpaid.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Style">
            <select name="watermark.style" className="field" defaultValue={wm.style ?? "diagonal"}>
              <option value="diagonal">Repeated diagonal</option>
              <option value="center">Large centered</option>
              <option value="layer">Translucent layer</option>
              <option value="banner">Compact banner</option>
            </select>
          </Field>
          <Field label="Size">
            <select name="watermark.size" className="field" defaultValue={wm.size ?? "md"}>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </Field>
        </div>
        <Field label="Text" error={state.fieldErrors?.watermark}>
          <input name="watermark.text" className="field" defaultValue={wm.text ?? "UNPAID PREVIEW — CONTACT TO PURCHASE"} maxLength={120} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Placement">
            <select name="watermark.placement" className="field" defaultValue={wm.placement ?? "full"}>
              <option value="full">Full page</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="center">Center</option>
            </select>
          </Field>
          <Field label={`Opacity`} hint="0.03–0.7">
            <input name="watermark.opacity" type="number" step="0.01" min="0.03" max="0.7" className="field" defaultValue={wm.opacity ?? 0.16} />
          </Field>
        </div>
        <Field label="Contact URL" hint="Where the watermark's contact link points.">
          <input name="watermark.contactUrl" type="url" className="field" placeholder="https://your-portfolio.example.com" defaultValue={wm.contactUrl ?? ""} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="watermark.showContactLink" defaultChecked={wm.showContactLink ?? true} />
          Show a contact link in the watermark
        </label>
      </Section>

      <Section
        title="Preview interactions"
        desc="What happens when visitors interact while unpaid. Forms and inputs are never intercepted."
      >
        <Field label="Mode">
          <select name="preview.mode" className="field" defaultValue={pv.mode ?? "links"}>
            <option value="off">Off — watermark only</option>
            <option value="links">Redirect ordinary link clicks</option>
            <option value="selected">Redirect selected elements only</option>
            <option value="strict">Strict — intercept all links & buttons</option>
          </select>
        </Field>
        <Field label="Redirect URL" hint="Where intercepted clicks go. Falls back to the watermark contact URL.">
          <input name="preview.redirectUrl" type="url" className="field" placeholder="https://your-portfolio.example.com" defaultValue={pv.redirectUrl ?? ""} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Selector (selected mode)" hint="CSS selector to intercept.">
            <input name="preview.selector" className="field font-mono" placeholder="[data-buy], .checkout" defaultValue={pv.selector ?? ""} />
          </Field>
          <Field label="Allow selector" hint="Elements to never intercept.">
            <input name="preview.allowSelector" className="field font-mono" placeholder="[data-lg-allow]" defaultValue={pv.allowSelector ?? ""} />
          </Field>
        </div>
        <Field label="Notice text" hint="Shown when there is no redirect URL.">
          <input name="preview.notice" className="field" maxLength={240} defaultValue={pv.notice ?? ""} placeholder="This is an unpaid preview. Contact to purchase." />
        </Field>
      </Section>

      <div className="flex items-center gap-3">
        <SubmitButton pendingText={mode === "create" ? "Creating…" : "Saving…"}>
          {mode === "create" ? "Create project" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <fieldset className="card p-5">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {desc ? <p className="mb-4 text-sm text-[var(--color-subtle)]">{desc}</p> : <div className="mb-2" />}
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error ? <p className="error-text">{error}</p> : hint ? <p className="help">{hint}</p> : null}
    </div>
  );
}

function Banner({ tone, children }: { tone: "ok" | "danger"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "border-[var(--color-ok-line)] bg-[var(--color-ok-bg)] text-[var(--color-ok)]"
      : "border-[var(--color-danger-line)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]";
  return (
    <div role="alert" className={`rounded-[var(--radius)] border px-3 py-2 text-sm ${cls}`}>
      {children}
    </div>
  );
}
