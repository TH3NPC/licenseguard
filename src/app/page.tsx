import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

const STEPS = [
  {
    n: "01",
    title: "Register a project",
    body: "Add the client site to your dashboard and set its allowed domains and watermark.",
  },
  {
    n: "02",
    title: "Drop in the SDK",
    body: "One <script> tag with your public project id. No secrets in the browser.",
  },
  {
    n: "03",
    title: "Preview is watermarked",
    body: "While unpaid, visitors see a clear watermark and your configured preview rules.",
  },
  {
    n: "04",
    title: "Activate on payment",
    body: "Verify payment server-side, activate the license, and the watermark lifts.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-[var(--color-line)]">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-5 w-5 rounded-[var(--radius-sm)] bg-[var(--color-accent)]" aria-hidden />
            <span className="font-semibold tracking-tight">{APP_NAME}</span>
          </div>
          <nav className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost btn-sm">
                  Sign in
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="py-16 sm:py-24 max-w-2xl">
          <p className="mono text-[var(--color-subtle)] mb-4">
            Preview protection · licensing · activation
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight tracking-tight">
            Ship client previews that stay yours until they&apos;re paid for.
          </h1>
          <p className="mt-4 text-base text-[var(--color-muted)] leading-relaxed">
            {APP_NAME} watermarks unpaid website previews and manages each
            project&apos;s license from a single dashboard. License state is
            decided on the server — never trusted from the browser.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={user ? "/dashboard" : "/register"} className="btn btn-primary">
              {user ? "Open dashboard" : "Create your account"}
            </Link>
            <Link href="/docs" className="btn btn-secondary">
              How it works
            </Link>
          </div>
        </section>

        <section className="pb-16 grid gap-px bg-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-[var(--color-surface)] p-5">
              <div className="mono text-[var(--color-subtle)] text-sm">{s.n}</div>
              <h2 className="mt-2 text-sm font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{s.body}</p>
            </div>
          ))}
        </section>

        <section className="pb-24 max-w-2xl">
          <div className="card p-5">
            <h2 className="text-sm font-semibold">An honest note on protection</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)] leading-relaxed">
              A client-side script can always be removed by someone with source
              access. The SDK deters casual reuse of unpaid work — it is not DRM.
              For strong enforcement, serve the preview through a server-controlled
              hosted deployment. {APP_NAME} is designed around this reality.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-line)]">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center text-sm text-[var(--color-subtle)]">
          {APP_NAME} — a developer tool.
        </div>
      </footer>
    </div>
  );
}
