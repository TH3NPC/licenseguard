import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const POINTS = [
  "Watermark unpaid client previews",
  "One script tag — works on any site",
  "Lift it the moment you're paid",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label="ZER home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 grid gap-4 md:grid-cols-2">
          {/* Brand panel */}
          <section
            className="hidden md:flex flex-col justify-between rounded-[var(--radius-lg)] p-10"
            style={{ background: "var(--brand)", color: "var(--on-brand)" }}
          >
            <p className="text-[0.72rem] font-semibold tracking-[0.14em] uppercase opacity-70">
              ZER
            </p>
            <div>
              <h2 className="text-[2.4rem] leading-[1.05]">
                Your work stays yours until it&apos;s paid for.
              </h2>
              <ul className="mt-8 space-y-3 text-sm">
                {POINTS.map((p) => (
                  <li key={p} className="flex items-center gap-3 opacity-90">
                    <span className="h-px w-5" style={{ background: "currentColor" }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs opacity-60">Secure sign-in powered by Supabase.</p>
          </section>

          {/* Form */}
          <section className="card p-7 sm:p-10 flex flex-col justify-center">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
