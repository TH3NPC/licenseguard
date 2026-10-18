"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/projects", label: "Projects", exact: false },
  { href: "/dashboard/settings", label: "Settings", exact: true },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 sm:flex-col sm:gap-0.5" aria-label="Dashboard">
      {LINKS.map((l) => {
        const active = l.exact
          ? pathname === l.href
          : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={
              "rounded-[var(--radius)] px-3 py-1.5 text-sm transition-colors " +
              (active
                ? "bg-[var(--color-surface-2)] font-medium text-[var(--color-ink)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]")
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
