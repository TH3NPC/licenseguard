import { CopyButton } from "./ui/CopyButton";
import { publicEnv } from "@/lib/env";
import { APP_NAME } from "@/lib/constants";

export function IntegrationPanel({ publicId }: { publicId: string }) {
  const base = publicEnv.appUrl.replace(/\/$/, "");
  const scriptSnippet = `<script\n  src="${base}/sdk/v1/licenseguard.js"\n  data-project-id="${publicId}"\n  defer\n></script>`;
  const moduleSnippet = `<script src="${base}/sdk/v1/licenseguard.js" defer></script>\n<script>\n  window.addEventListener('load', function () {\n    LicenseGuard.init({\n      projectId: '${publicId}',\n      apiBase: '${base}'\n    });\n  });\n</script>`;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold">Integration</h2>
        <a
          href={`/preview/${publicId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-sm"
        >
          Open live preview ↗
        </a>
      </div>
      <p className="mt-1 text-sm text-[var(--color-subtle)]">
        Add this to the <code className="mono">&lt;head&gt;</code> of the site
        you are building. The{" "}
        <span className="mono">data-project-id</span> is a{" "}
        <strong>public</strong> identifier — it is safe in the browser and is
        not a secret. Use <strong>Open live preview</strong> to see this
        project&apos;s watermark on a sample site right now.
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="label mb-0">Script tag (recommended)</span>
          <CopyButton value={scriptSnippet} />
        </div>
        <pre className="mono text-xs overflow-x-auto rounded-[var(--radius)] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3 whitespace-pre">
          {scriptSnippet}
        </pre>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="label mb-0">Programmatic init</span>
          <CopyButton value={moduleSnippet} />
        </div>
        <pre className="mono text-xs overflow-x-auto rounded-[var(--radius)] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3 whitespace-pre">
          {moduleSnippet}
        </pre>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold">Troubleshooting</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--color-muted)] list-disc pl-5">
          <li>
            Watermark not showing? Confirm the page origin is in{" "}
            <strong>Allowed domains</strong>. Unlisted origins are rejected.
          </li>
          <li>
            Nothing happens at all? The SDK fails safe on network errors — check
            the browser console and that <span className="mono">{base}</span> is
            reachable.
          </li>
          <li>
            Watermark won&apos;t lift after activating? The SDK caches status per
            session; hard-refresh or wait up to 60s.
          </li>
          <li>
            Need stronger enforcement than a script? Use the {APP_NAME} hosted
            preview (see the security docs).
          </li>
        </ul>
      </div>
    </div>
  );
}
