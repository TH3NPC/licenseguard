import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { effectiveStatus } from "@/lib/licensing";
import { LICENSE_STATUS } from "@/lib/constants";
import { usageSummaryForOwner } from "@/lib/usage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

function StatTile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-[var(--color-muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-[var(--color-subtle)]">{hint}</div> : null}
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
  let endedOrBlocked = 0;
  for (const p of projects) {
    const s = effectiveStatus(p.license, now);
    if (s === LICENSE_STATUS.ACTIVE) active++;
    else if (s === LICENSE_STATUS.UNPAID_PREVIEW) preview++;
    else endedOrBlocked++; // expired | revoked | suspended
  }

  const usage = await usageSummaryForOwner(user.id, 30);

  const events = await prisma.licenseEvent.findMany({
    where: { project: { ownerId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { project: { select: { id: true, name: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <h1 className="text-xl font-semibold">Overview</h1>
        <Link href="/dashboard/projects/new" className="btn btn-primary btn-sm">
          Create project
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body="Register your first client project to start protecting its preview with a watermark and a managed license."
          action={
            <Link href="/dashboard/projects/new" className="btn btn-primary">
              Create project
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatTile label="Projects" value={projects.length} />
            <StatTile label="In preview" value={preview} hint="Unpaid / watermarked" />
            <StatTile label="Active licenses" value={active} />
            <StatTile label="Expired / blocked" value={endedOrBlocked} />
          </div>

          <div className="card p-4 mb-6">
            <div className="text-sm text-[var(--color-muted)]">
              License checks (last 30 days)
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {usage.total}
            </div>
            <div className="mt-0.5 text-xs text-[var(--color-subtle)]">
              Counted server-side from real SDK requests.
            </div>
          </div>

          <h2 className="text-sm font-semibold mb-2">Recent license events</h2>
          {events.length === 0 ? (
            <p className="text-sm text-[var(--color-subtle)]">No events yet.</p>
          ) : (
            <ul className="card divide-y divide-[var(--color-line)]">
              {events.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/projects/${e.project.id}`}
                      className="text-sm font-medium underline-offset-2 hover:underline truncate block"
                    >
                      {e.project.name}
                    </Link>
                    <span className="text-xs text-[var(--color-subtle)]">
                      {e.type}
                      {e.toStatus ? ` → ${e.toStatus}` : ""} ·{" "}
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {e.toStatus ? <StatusBadge status={e.toStatus} /> : null}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
