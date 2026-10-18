import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const FEATURES = [
  {
    title: "Visible watermarks",
    body: "Unpaid previews get a clear, configurable watermark — diagonal, centered, layered, or a compact banner.",
    icon: (
      <path d="M4 7h16M4 12h16M4 17h10" strokeWidth="1.8" strokeLinecap="round" />
    ),
  },
  {
    title: "Server-side licensing",
    body: "The license state is decided on your server and can never be faked from the browser.",
    icon: (
      <path
        d="M12 3l7 3v5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6l7-3Z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Preview interactions",
    body: "Redirect clicks to your portfolio, show a purchase notice, or lock down commercial actions — your rules.",
    icon: (
      <path
        d="M7 12l3 3 7-7M5 19h14"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "One-line SDK",
    body: "Drop a single script tag into any site. No secrets in the browser, works everywhere.",
    icon: (
      <path
        d="M8 9l-3 3 3 3M16 9l3 3-3 3M13 6l-2 12"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

const STEPS = [
  ["01", "Register a project", "Add the client site, set allowed domains and a watermark."],
  ["02", "Drop in the SDK", "One script tag with your public project id."],
  ["03", "Preview is watermarked", "Visitors see the watermark while it's unpaid."],
  ["04", "Activate on payment", "Verify payment, flip the license, watermark lifts."],
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-2">
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

      {/* Hero */}
      <section className="relative">
        <div className="hero-glow" />
        <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted)] shadow-[var(--shadow-sm)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
            Preview protection · licensing · activation
          </span>
          <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight max-w-3xl mx-auto">
            Ship client previews that stay{" "}
            <span className="brand-gradient">yours</span> until they&apos;re paid for.
          </h1>
          <p className="mt-6 text-lg text-[var(--muted)] leading-relaxed max-w-xl mx-auto">
            {APP_NAME} watermarks unpaid website previews and manages every
            project&apos;s license from one dashboard. License state is decided
            on the server — never trusted from the browser.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 justify-center">
            <Link href={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">
              {user ? "Open dashboard" : "Start free"}
            </Link>
            <Link href="/docs" className="btn btn-secondary btn-lg">
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-6xl px-4 pb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-hover p-5">
              <span className="grid place-items-center h-10 w-10 rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  {f.icon}
                </svg>
              </span>
              <h3 className="mt-4 text-[0.95rem] font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-center">How it works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([n, title, body]) => (
            <div key={n} className="relative card p-5">
              <span className="text-2xl font-extrabold brand-gradient">{n}</span>
              <h3 className="mt-2 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Honesty note */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <div className="card p-6 border-[var(--line-strong)]">
          <h2 className="text-base font-semibold">An honest note on protection</h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            A client-side script can always be removed by someone with source
            access. The SDK deters casual reuse of unpaid work — it is not DRM.
            For strong enforcement, serve the preview through a server-controlled
            hosted deployment. {APP_NAME} is designed around this reality.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface)] p-10 text-center shadow-[var(--shadow)]">
          <div className="hero-glow" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Protect your next client preview in minutes.
            </h2>
            <p className="mt-3 text-[var(--muted)]">
              Free to start. One script tag. Full control from your dashboard.
            </p>
            <div className="mt-7">
              <Link href={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">
                {user ? "Open dashboard" : "Create your account"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between text-sm text-[var(--subtle)]">
          <Logo size={22} />
          <span>A developer tool.</span>
        </div>
      </footer>
    </div>
  );
}
