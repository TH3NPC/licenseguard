import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: "How it works" };

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-[var(--color-muted)] underline-offset-2 hover:underline">
        ← {APP_NAME}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">How {APP_NAME} works</h1>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold">1. Register a project</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Create a project in your dashboard. You get a <strong>public</strong>{" "}
          project id and configure the watermark, allowed domains, and preview
          interaction rules.
        </p>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold">2. Add the SDK</h2>
        <pre className="mono text-xs overflow-x-auto rounded-[var(--radius)] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3">
{`<script
  src="https://your-host/sdk/v1/licenseguard.js"
  data-project-id="lg_pub_xxxxxxxxxxxx"
  defer
></script>`}
        </pre>
        <p className="text-sm text-[var(--color-muted)]">
          On load, the SDK asks the server for the project&apos;s current license
          state and renders the right experience. It never decides licensing
          itself, and no secret is in the browser.
        </p>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold">3. Unpaid → watermarked, paid → clean</h2>
        <p className="text-sm text-[var(--color-muted)]">
          While a project is unpaid, visitors see the watermark and your preview
          rules. When you activate its license (manually, or later via verified
          payment), the watermark lifts.
        </p>
      </section>

      <section className="mt-8 rounded-[var(--radius)] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4">
        <h2 className="text-sm font-semibold">Honest limits of a client SDK</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          A script running in the browser can be removed by anyone with source
          access, and CSS or screenshots can bypass a visual watermark. {APP_NAME}{" "}
          deters casual reuse of unpaid work — it is not DRM. For strong
          enforcement, serve the preview from a server-controlled deployment
          where the protected content itself is gated by the license check.
        </p>
      </section>

      <div className="mt-8">
        <Link href="/register" className="btn btn-primary">Get started</Link>
      </div>
    </div>
  );
}
