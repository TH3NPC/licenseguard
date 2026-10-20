import Link from "next/link";
import { requireUser } from "@/lib/session";
import { DashboardNav } from "@/components/DashboardNav";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logoutAction } from "@/app/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" aria-label="Dashboard">
            <Logo />
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="hidden md:inline text-xs text-[var(--subtle)] truncate max-w-[200px] mr-2">
              {user.email}
            </span>
            <ThemeToggle />
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-4 md:grid-cols-[200px_1fr] md:items-start">
        <aside className="card p-2 md:sticky md:top-[88px]">
          <DashboardNav />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
