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
    <nav className="flex gap-1 md:flex-col" aria-label="Dashboard">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={
              "flex-1 md:flex-none rounded-[var(--radius)] px-3 py-2 text-sm font-semibold transition-colors text-center md:text-left " +
              (active
                ? "bg-[var(--brand)] text-[var(--on-brand)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]")
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
