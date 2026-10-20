import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WatermarkPreview } from "@/components/WatermarkPreview";

const STEPS = [
  ["01", "Add your project", "Register the client site and the domain it runs on."],
  ["02", "Paste one script", "A single tag in the site's head. No secrets in the browser."],
  ["03", "Activate when paid", "Flip the license and the watermark lifts on the next load."],
];

export default async function Home() {
  const user = await getCurrentUser();
  const primaryHref = user ? "/dashboard" : "/register";

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label="ZER home">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1.5">
            <Link href="/docs" className="btn btn-ghost btn-sm hidden sm:inline-flex">
              How it works
            </Link>
            <ThemeToggle />
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

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Hero */}
          <section className="card p-7 sm:p-10 lg:col-span-3 flex flex-col justify-center">
            <p className="eyebrow">Preview protection for web developers</p>
            <h1 className="mt-4 text-[2.3rem] sm:text-[3.1rem] leading-[1.02]">
              Show the work.
              <br />
              Get paid. Then hand it over.
            </h1>
            <p className="mt-5 max-w-md text-[var(--muted)]">
              ZER watermarks the sites you build for clients until they pay — and
              removes it the moment you activate the license.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={primaryHref} className="btn btn-primary btn-lg">
                {user ? "Open dashboard" : "Start free"}
              </Link>
              <Link href="/docs" className="btn btn-secondary btn-lg">
                How it works
              </Link>
            </div>
          </section>

          {/* What the client sees */}
          <section className="card p-4 lg:col-span-2 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="box-title">What your client sees</span>
              <span className="badge badge-warn">Unpaid</span>
            </div>
            <WatermarkPreview
              style="diagonal"
              theme="auto"
              siteTone="light"
              text="UNPAID PREVIEW — CONTACT TO PURCHASE"
              opacity={0.22}
              size="md"
              height={150}
            />
            <WatermarkPreview
              style="diagonal"
              theme="auto"
              siteTone="dark"
              text="UNPAID PREVIEW — CONTACT TO PURCHASE"
              opacity={0.22}
              size="md"
              height={150}
            />
            <p className="px-1 text-xs text-[var(--subtle)]">
              Readable on light and dark sites alike.
            </p>
          </section>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map(([n, title, body]) => (
            <section key={n} className="card p-6">
              <span className="font-serif text-3xl font-bold text-[var(--accent)]">{n}</span>
              <h2 className="mt-3 text-xl">{title}</h2>
              <p className="mt-1.5 text-sm text-[var(--muted)]">{body}</p>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between text-xs text-[var(--subtle)]">
          <span>ZER — for developers who get paid for their work.</span>
          <Link href="/docs" className="underline underline-offset-2 hover:text-[var(--ink)]">
            Limits &amp; security
          </Link>
        </div>
      </footer>
    </div>
  );
}
