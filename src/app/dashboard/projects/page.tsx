import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listProjectsForOwner } from "@/lib/projects";
import { effectiveStatus } from "@/lib/licensing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await listProjectsForOwner(user.id);
  const now = new Date();

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <h1 className="text-xl font-semibold">Projects</h1>
        <Link href="/dashboard/projects/new" className="btn btn-primary btn-sm">
          Create project
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body="Create a project to generate its public id and integration snippet."
          action={
            <Link href="/dashboard/projects/new" className="btn btn-primary">
              Create project
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <table className="hidden sm:table w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface-2)] text-left">
                <th className="px-4 py-2.5 font-medium">Project</th>
                <th className="px-4 py-2.5 font-medium">Public id</th>
                <th className="px-4 py-2.5 font-medium">Env</th>
                <th className="px-4 py-2.5 font-medium">License</th>
                <th className="px-4 py-2.5 font-medium text-right">Domains</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-surface-2)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 mono text-[var(--color-muted)]">{p.publicId}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{p.environment}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={effectiveStatus(p.license, now)} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--color-muted)]">
                    {p._count.domains}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile list */}
          <ul className="sm:hidden divide-y divide-[var(--color-line)]">
            {projects.map((p) => (
              <li key={p.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/dashboard/projects/${p.id}`} className="font-medium">
                    {p.name}
                  </Link>
                  <StatusBadge status={effectiveStatus(p.license, now)} />
                </div>
                <div className="mt-1 mono text-xs text-[var(--color-subtle)] truncate">
                  {p.publicId}
                </div>
                <div className="mt-1 text-xs text-[var(--color-subtle)]">
                  {p.environment} · {p._count.domains} domain(s)
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
