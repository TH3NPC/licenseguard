import { CopyButton } from "./ui/CopyButton";
import { publicEnv } from "@/lib/env";

export function IntegrationPanel({ publicId }: { publicId: string }) {
  const base = publicEnv.appUrl.replace(/\/$/, "");
  const scriptSnippet = `<script\n  src="${base}/sdk/v1/licenseguard.js"\n  data-project-id="${publicId}"\n  data-api="${base}"\n  defer\n></script>`;
  const moduleSnippet = `<script src="${base}/sdk/v1/licenseguard.js" defer></script>\n<script>\n  window.addEventListener('load', function () {\n    LicenseGuard.init({ projectId: '${publicId}', apiBase: '${base}' });\n  });\n</script>`;

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="box-title">Step 1 · Paste into your site</span>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Put this inside the <code className="mono">&lt;head&gt;</code> of the
              client&apos;s website, then redeploy it.
            </p>
          </div>
          <CopyButton value={scriptSnippet} label="Copy script" className="btn btn-primary btn-sm" />
        </div>
        <pre className="mono mt-4 text-xs overflow-x-auto rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4 whitespace-pre">
          {scriptSnippet}
        </pre>
        <p className="help">
          The project id is public and safe to share — it isn&apos;t a password.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <span className="box-title">Step 2 · Allow the domain</span>
          <p className="mt-2 text-sm text-[var(--muted)]">
            In the <strong>Settings</strong> tab, add the site&apos;s domain (like{" "}
            <code className="mono">client.com</code>) under Allowed domains. Use{" "}
            <code className="mono">*</code> while testing.
          </p>
        </section>
        <section className="card p-5 flex flex-col justify-between gap-3">
          <div>
            <span className="box-title">Step 3 · Check it</span>
            <p className="mt-2 text-sm text-[var(--muted)]">
              See this project&apos;s watermark on a sample site right now.
            </p>
          </div>
          <div>
            <a
              href={`/preview/${publicId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              Open live preview ↗
            </a>
          </div>
        </section>
      </div>

      <section className="card p-5 space-y-4">
        <details className="more">
          <summary>Not seeing the watermark?</summary>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)] list-disc pl-5">
            <li>The site&apos;s domain must be in Allowed domains (or set it to <code className="mono">*</code>).</li>
            <li>Opening the page as a file (<code className="mono">file://</code>) won&apos;t work — host it or use localhost.</li>
            <li>On a dark site, set the watermark to <strong>Auto</strong> or <strong>Dark sites</strong> in Settings.</li>
            <li>After activating a license, reload — the SDK caches status for up to 60 seconds.</li>
          </ul>
        </details>
        <details className="more">
          <summary>Using React, Next.js or another framework?</summary>
          <div className="mt-3 flex items-start justify-between gap-3">
            <pre className="mono text-xs overflow-x-auto rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4 whitespace-pre flex-1">
              {moduleSnippet}
            </pre>
            <CopyButton value={moduleSnippet} />
          </div>
        </details>
      </section>
    </div>
  );
}
