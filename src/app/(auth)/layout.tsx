import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
      <div className="hero-glow" />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo size={32} />
        </Link>
        <div className="card p-6 shadow-[var(--shadow)]">{children}</div>
        <p className="mt-6 text-center text-xs text-[var(--subtle)]">
          Secured with server-side sessions. Your password is never stored in plain text.
        </p>
      </div>
    </main>
  );
}
