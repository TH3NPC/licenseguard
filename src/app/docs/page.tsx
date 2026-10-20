import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = { title: "How it works" };

const STEPS = [
  {
    n: "01",
    title: "Create a project",
    body: "Add the client's site in your dashboard and the domain it runs on. You get a public project id.",
  },
  {
    n: "02",
    title: "Paste one script",
    body: "Copy the script from the project's Setup tab into the site's <head>. No secrets ever go in the browser.",
  },
  {
    n: "03",
    title: "Activate when paid",
    body: "While unpaid, visitors see the watermark. Activate the license and it lifts on the next page load.",
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label="ZER home">
            <Logo />
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 space-y-4">
        <div className="card p-7">
          <p className="eyebrow">How it works</p>
          <h1 className="mt-2 text-[2.6rem]">Three steps. One script.</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <section key={s.n} className="card p-6">
              <span className="font-serif text-3xl font-bold text-[var(--accent)]">{s.n}</span>
              <h2 className="mt-3 text-xl">{s.title}</h2>
              <p className="mt-1.5 text-sm text-[var(--muted)]">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="card p-6">
            <h2 className="box-title">The script</h2>
            <pre className="mono mt-3 text-xs overflow-x-auto rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4">
{`<script
  src="https://your-zer-app/sdk/v1/licenseguard.js"
  data-project-id="lg_pub_…"
  defer
></script>`}
            </pre>
          </section>
          <section className="card p-6">
            <h2 className="box-title">Honest limits</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              A script in the browser can be removed by anyone with the site&apos;s
              source code, and a screenshot can&apos;t be stopped. ZER deters casual
              reuse of unpaid work — it isn&apos;t DRM. For strong enforcement, keep
              the preview on a server you control until you&apos;re paid.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
