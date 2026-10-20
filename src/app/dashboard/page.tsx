import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { effectiveStatus } from "@/lib/licensing";
import { LICENSE_STATUS } from "@/lib/constants";
import { usageSummaryForOwner } from "@/lib/usage";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

const STEPS = [
  { n: "01", title: "Create a project", body: "Add the client site and its domain." },
  { n: "02", title: "Paste the script", body: "Copy it from the project's Setup tab." },
  { n: "03", title: "Activate when paid", body: "The watermark lifts on the next load." },
];

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint?: string;
  tone: "ink" | "ok" | "warn" | "accent";
}) {
  const color =
    tone === "ok" ? "var(--ok)" : tone === "warn" ? "var(--warn)" : tone === "accent" ? "var(--accent)" : "var(--ink)";
  return (
    <div className="card p-5">
      <div className="box-title">{label}</div>
      <div className="mt-2 font-serif text-[2.3rem] font-bold leading-none tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="mt-2 text-xs text-[var(--subtle)] min-h-[1rem]">{hint ?? ""}</div>
    </div>
  );
}

function QuickStart() {
  return (
    <div className="card p-6">
      <div className="box-title">Getting started</div>
      <ol className="mt-4 space-y-4">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-3">
            <span className="font-serif text-xl font-bold text-[var(--accent)] leading-none pt-0.5">{s.n}</span>
            <div>
              <div className="text-sm font-semibold">{s.title}</div>
              <div className="text-xs text-[var(--muted)]">{s.body}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function OverviewPage() {
  const user = await requireUser();

  const projects = await prisma.project.findMany({
    where: { ownerId: user.id, status: { not: "archived" } },
    include: { license: true },
  });

  const now = new Date();
  let active = 0;
  let preview = 0;
  let ended = 0;
  for (const p of projects) {
    const s = effectiveStatus(p.license, now);
    if (s === LICENSE_STATUS.ACTIVE) active++;
    else if (s === LICENSE_STATUS.UNPAID_PREVIEW) preview++;
    else ended++;
  }

  const usage = await usageSummaryForOwner(user.id, 30);
  const events = await prisma.licenseEvent.findMany({
    where: { project: { ownerId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { project: { select: { id: true, name: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem]">Overview</h1>
          <p className="text-sm text-[var(--muted)]">
            {projects.length === 0
              ? "Nothing here yet — create your first project."
              : `${projects.length} project${projects.length === 1 ? "" : "s"} under your account.`}
          </p>
        </div>
        <Link href="/dashboard/projects/new" className="btn btn-primary">
          Create project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-6 flex flex-col justify-center">
            <h2 className="text-2xl">Protect your first preview</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Create a project, paste one script into the client&apos;s site, and it
              shows a watermark until you activate the license.
            </p>
            <div className="mt-5">
              <Link href="/dashboard/projects/new" className="btn btn-primary">
                Create project
              </Link>
            </div>
          </div>
          <QuickStart />
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Stat label="Projects" value={projects.length} tone="ink" />
            <Stat label="Unpaid preview" value={preview} tone="warn" hint="Showing a watermark" />
            <Stat
              label="Active"
              value={active}
              tone="ok"
              hint={ended > 0 ? `${ended} expired or revoked` : "Watermark removed"}
            />
            <Stat label="License checks" value={usage.total} tone="accent" hint="Last 30 days" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <span className="box-title">Recent activity</span>
                <Link href="/dashboard/projects" className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]">
                  All projects →
                </Link>
              </div>
              {events.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-[var(--subtle)]">No activity yet.</p>
              ) : (
                <ul className="border-t border-[var(--line)] divide-y divide-[var(--line)]">
                  {events.map((e) => (
                    <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/projects/${e.project.id}`}
                          className="text-sm font-semibold hover:underline underline-offset-2 truncate block"
                        >
                          {e.project.name}
                        </Link>
                        <span className="text-xs text-[var(--subtle)]">
                          {e.type} · {new Date(e.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {e.toStatus ? <StatusBadge status={e.toStatus} /> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <QuickStart />
          </div>
        </>
      )}
    </div>
  );
}
