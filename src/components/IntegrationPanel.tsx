import Link from "next/link";
import { CopyButton } from "./ui/CopyButton";
import { InstallCheck } from "./InstallCheck";
import { getAppBaseUrl } from "@/lib/app-url";

export async function IntegrationPanel({
  publicId,
  projectId,
  websiteUrl,
  domains,
}: {
  publicId: string;
  projectId: string;
  websiteUrl: string | null;
  domains: string[];
}) {
  const base = await getAppBaseUrl();
  const scriptSnippet = `<script\n  src="${base}/sdk/v1/licenseguard.js"\n  data-project-id="${publicId}"\n  data-api="${base}"\n  defer\n></script>`;
  const moduleSnippet = `<script src="${base}/sdk/v1/licenseguard.js" defer></script>\n<script>\n  window.addEventListener('load', function () {\n    LicenseGuard.init({ projectId: '${publicId}', apiBase: '${base}' });\n  });\n</script>`;
  const settingsHref = `/dashboard/projects/${projectId}?tab=settings`;

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="box-title">Step 1 · Paste into your site</span>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Put this inside the <code className="mono">&lt;head&gt;</code> of the
              client&apos;s website, then redeploy that site.
            </p>
          </div>
          <CopyButton value={scriptSnippet} label="Copy script" className="btn btn-primary btn-sm" />
        </div>
        <pre className="mono mt-4 text-xs overflow-x-auto rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4 whitespace-pre">
          {scriptSnippet}
        </pre>
        <details className="more mt-4">
          <summary>Using React, Next.js or another framework?</summary>
          <div className="mt-3 flex items-start justify-between gap-3">
            <pre className="mono text-xs overflow-x-auto rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4 whitespace-pre flex-1">
              {moduleSnippet}
            </pre>
            <CopyButton value={moduleSnippet} />
          </div>
        </details>
      </section>

      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <section className="card p-5">
          <span className="box-title">Step 2 · Allowed sites</span>
          {domains.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {domains.map((d) => (
                <li key={d} className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--ok)]">✓</span>
                  <code className="mono">{d}</code>
                  {d === "*" ? <span className="text-xs text-[var(--subtle)]">any site — testing only</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--warn)]">
              No sites allowed yet — the watermark won&apos;t show anywhere except localhost.
            </p>
          )}
          <Link href={settingsHref} className="mt-4 inline-flex btn btn-secondary btn-sm">
            Change allowed sites
          </Link>
        </section>

        <section className="card p-5 space-y-3">
          <span className="box-title">Step 3 · Check it works</span>
          {websiteUrl ? (
            <>
              <p className="text-sm text-[var(--muted)]">
                ZER will visit <code className="mono">{websiteUrl.replace(/^https?:\/\//, "")}</code>{" "}
                and confirm the script is installed.
              </p>
              <InstallCheck projectId={projectId} />
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Add the client&apos;s website in{" "}
              <Link href={settingsHref} className="underline underline-offset-2">Settings</Link> to
              check the installation automatically.
            </p>
          )}
          <p className="text-xs text-[var(--subtle)] pt-1 border-t border-[var(--line)]">
            Not deployed yet?{" "}
            <a
              href={`/preview/${publicId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              See the watermark on a sample site ↗
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
