import Link from "next/link";
import { requireUser } from "@/lib/session";
import { APP_NAME } from "@/lib/constants";
import { DashboardNav } from "@/components/DashboardNav";
import { logoutAction } from "@/app/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="inline-block h-5 w-5 rounded-[var(--radius-sm)] bg-[var(--color-accent)]" aria-hidden />
            <span className="font-semibold tracking-tight">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-[var(--color-subtle)] truncate max-w-[180px]">
              {user.email}
            </span>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:grid sm:grid-cols-[180px_1fr] sm:gap-8">
        <aside className="mb-4 sm:mb-0">
          <DashboardNav />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
