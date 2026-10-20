"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "./ui/SubmitButton";
import { WatermarkPreview } from "./WatermarkPreview";
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

const THEMES = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light sites" },
  { value: "dark", label: "Dark sites" },
];

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

  // Live-preview state (these fields are controlled; the rest stay uncontrolled).
  const [style, setStyle] = useState<string>(wm.style ?? "diagonal");
  const [theme, setTheme] = useState<string>(wm.theme ?? "auto");
  const [text, setText] = useState(wm.text ?? "UNPAID PREVIEW — CONTACT TO PURCHASE");
  const [opacity, setOpacity] = useState(wm.opacity ?? 0.2);
  const [size, setSize] = useState<string>(wm.size ?? "md");
  const [placement, setPlacement] = useState<string>(wm.placement ?? "full");
  const [contactUrl, setContactUrl] = useState(wm.contactUrl ?? "");
  const [showContactLink, setShowContactLink] = useState(wm.showContactLink ?? true);
  const [siteTone, setSiteTone] = useState<"light" | "dark">(
    wm.theme === "dark" ? "dark" : "light",
  );

  return (
    <form action={formAction} className="grid gap-4 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="space-y-4 min-w-0">
        {state.error ? <Banner tone="danger">{state.error}</Banner> : null}
        {state.ok && state.message ? <Banner tone="ok">{state.message}</Banner> : null}

        <Box title="Project">
          <Field label="Name" error={state.fieldErrors?.name}>
            <input name="name" className="field" required defaultValue={defaults.name} placeholder="Client website" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Website URL" hint="Optional" error={state.fieldErrors?.websiteUrl}>
              <input name="websiteUrl" type="url" className="field" placeholder="https://client.com" defaultValue={defaults.websiteUrl} />
            </Field>
            <Field label="Environment">
              <select name="environment" className="field" defaultValue={defaults.environment ?? "development"}>
                <option value="development">Development</option>
                <option value="production">Production</option>
              </select>
            </Field>
          </div>
        </Box>

        <Box title="Where it runs">
          <Field
            label="Allowed domains"
            hint="One per line — just the domain, like client.com. Use * while testing to allow any site."
          >
            <textarea
              name="domains"
              className="field font-mono text-sm"
              rows={3}
              placeholder={"client.com\nclient.vercel.app"}
              defaultValue={(defaults.domains ?? []).join("\n")}
            />
          </Field>
        </Box>

        <Box title="Watermark">
          <div>
            <span className="label">Made for</span>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-[var(--radius)] border border-[var(--line-strong)]">
              {THEMES.map((t) => (
                <label
                  key={t.value}
                  className={
                    "cursor-pointer rounded-[var(--radius-sm)] px-2 py-1.5 text-center text-xs font-semibold transition-colors " +
                    (theme === t.value
                      ? "bg-[var(--brand)] text-[var(--on-brand)]"
                      : "text-[var(--muted)] hover:text-[var(--ink)]")
                  }
                >
                  <input
                    type="radio"
                    name="watermark.theme"
                    value={t.value}
                    checked={theme === t.value}
                    onChange={() => {
                      setTheme(t.value);
                      if (t.value !== "auto") setSiteTone(t.value as "light" | "dark");
                    }}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
            <p className="help">
              Auto reads the site&apos;s background and picks a dark or light watermark for you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Style">
              <select name="watermark.style" className="field" value={style} onChange={(e) => setStyle(e.target.value)}>
                <option value="diagonal">Repeated diagonal</option>
                <option value="center">Large centered</option>
                <option value="layer">Even layer</option>
                <option value="banner">Banner bar</option>
              </select>
            </Field>
            <Field label="Size">
              <select name="watermark.size" className="field" value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </Field>
          </div>

          <Field label="Text" error={state.fieldErrors?.watermark}>
            <input
              name="watermark.text"
              className="field"
              maxLength={120}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </Field>

          <div>
            <div className="flex items-center justify-between">
              <span className="label mb-0">Strength</span>
              <span className="text-xs font-semibold tabular-nums text-[var(--muted)]">
                {Math.round(opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              name="watermark.opacity"
              min={0.05}
              max={0.6}
              step={0.01}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--accent)]"
            />
          </div>

          <details className="more">
            <summary>More options</summary>
            <div className="mt-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Banner position">
                  <select
                    name="watermark.placement"
                    className="field"
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                  >
                    <option value="full">Full page</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="center">Center</option>
                  </select>
                </Field>
                <Field label="Contact URL">
                  <input
                    name="watermark.contactUrl"
                    type="url"
                    className="field"
                    placeholder="https://your-portfolio.com"
                    value={contactUrl}
                    onChange={(e) => setContactUrl(e.target.value)}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="watermark.showContactLink"
                  checked={showContactLink}
                  onChange={(e) => setShowContactLink(e.target.checked)}
                />
                Show a &quot;Contact to purchase&quot; link (banner style)
              </label>
            </div>
          </details>
        </Box>

        <Box title="When visitors click">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Behavior">
              <select name="preview.mode" className="field" defaultValue={pv.mode ?? "links"}>
                <option value="off">Do nothing — watermark only</option>
                <option value="links">Send link clicks to my page</option>
                <option value="selected">Only specific buttons</option>
                <option value="strict">All links &amp; buttons (strict)</option>
              </select>
            </Field>
            <Field label="Send them to" hint="Your portfolio or contact page">
              <input
                name="preview.redirectUrl"
                type="url"
                className="field"
                placeholder="https://your-portfolio.com"
                defaultValue={pv.redirectUrl ?? ""}
              />
            </Field>
          </div>
          <p className="help -mt-1">Forms and text fields always keep working.</p>

          <details className="more">
            <summary>More options</summary>
            <div className="mt-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Specific buttons (CSS selector)" hint='Used by "Only specific buttons"'>
                  <input name="preview.selector" className="field font-mono" placeholder=".buy, [data-checkout]" defaultValue={pv.selector ?? ""} />
                </Field>
                <Field label="Never block (CSS selector)">
                  <input name="preview.allowSelector" className="field font-mono" placeholder="[data-lg-allow]" defaultValue={pv.allowSelector ?? ""} />
                </Field>
              </div>
              <Field label="Message when there's no link" hint="Shown as a small notice">
                <input
                  name="preview.notice"
                  className="field"
                  maxLength={240}
                  defaultValue={pv.notice ?? ""}
                  placeholder="This is an unpaid preview. Contact to purchase."
                />
              </Field>
            </div>
          </details>
        </Box>

        <div className="card p-4 flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--subtle)]">
            {mode === "create" ? "You can change all of this later." : "Changes apply on the site's next page load."}
          </span>
          <SubmitButton pendingText={mode === "create" ? "Creating…" : "Saving…"}>
            {mode === "create" ? "Create project" : "Save changes"}
          </SubmitButton>
        </div>
      </div>

      {/* Live preview */}
      <aside className="card p-4 lg:sticky lg:top-[88px] space-y-3">
        <div className="flex items-center justify-between">
          <span className="box-title">Live preview</span>
          <div className="flex gap-1 p-0.5 rounded-[var(--radius)] border border-[var(--line)]">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSiteTone(t)}
                aria-pressed={siteTone === t}
                className={
                  "px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] font-semibold capitalize " +
                  (siteTone === t ? "bg-[var(--brand)] text-[var(--on-brand)]" : "text-[var(--muted)]")
                }
              >
                {t} site
              </button>
            ))}
          </div>
        </div>
        <WatermarkPreview
          style={style}
          theme={theme}
          siteTone={siteTone}
          text={text}
          opacity={opacity}
          size={size}
          placement={placement}
          contactUrl={contactUrl}
          showContactLink={showContactLink}
          height={300}
        />
        <p className="text-xs text-[var(--subtle)]">
          Exactly what visitors see while the project is unpaid. Switch between a light
          and dark site to check it reads well on both.
        </p>
      </aside>
    </form>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="box-title mb-4">{title}</div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
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
      ? "border-[var(--ok-line)] bg-[var(--ok-bg)] text-[var(--ok)]"
      : "border-[var(--danger-line)] bg-[var(--danger-bg)] text-[var(--danger)]";
  return (
    <div role="alert" className={`rounded-[var(--radius)] border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}
