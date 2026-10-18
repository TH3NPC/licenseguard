import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getProjectForOwner } from "@/lib/projects";
import { effectiveStatus } from "@/lib/licensing";
import { LICENSE_STATUS } from "@/lib/constants";
import { parsePreviewConfig, parseWatermarkConfig } from "@/lib/validation";
import { updateProjectAction, archiveProjectAction } from "@/app/actions/projects";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyButton } from "@/components/ui/CopyButton";
import { ProjectForm } from "@/components/ProjectForm";
import { LicensePanel } from "@/components/LicensePanel";
import { IntegrationPanel } from "@/components/IntegrationPanel";
import { CredentialsPanel } from "@/components/CredentialsPanel";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const project = await getProjectForOwner(user.id, id);
  if (!project) notFound();

  const watermark = parseWatermarkConfig(project.watermarkConfig);
  const preview = parsePreviewConfig(project.previewConfig);
  const effective = effectiveStatus(project.license, new Date());
  const update = updateProjectAction.bind(null, project.id);

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <Link href="/dashboard/projects" className="text-sm text-[var(--color-muted)] underline-offset-2 hover:underline">
          ← Projects
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">{project.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <code className="mono text-xs text-[var(--color-muted)]">{project.publicId}</code>
              <CopyButton value={project.publicId} label="Copy id" className="btn btn-ghost btn-sm" />
            </div>
          </div>
          <StatusBadge status={effective} />
        </div>
        {effective === LICENSE_STATUS.EXPIRED && project.license?.status === LICENSE_STATUS.ACTIVE ? (
          <p className="mt-2 text-xs text-[var(--color-warn)]">
            Stored as active but past its expiry — serving as expired.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-6">
        <LicensePanel
          projectId={project.id}
          effective={effective}
          storedStatus={project.license?.status ?? "unpaid_preview"}
          activatedAt={project.license?.activatedAt?.toISOString() ?? null}
          expiresAt={project.license?.expiresAt?.toISOString() ?? null}
          note={project.license?.note ?? null}
        />

        <IntegrationPanel publicId={project.publicId} />

        <section>
          <h2 className="text-sm font-semibold mb-3">Configuration</h2>
          <ProjectForm
            mode="edit"
            action={update}
            defaults={{
              name: project.name,
              websiteUrl: project.websiteUrl ?? "",
              environment: project.environment,
              domains: project.domains.map((d) => d.domain),
              watermark,
              preview,
            }}
          />
        </section>

        <CredentialsPanel
          projectId={project.id}
          credentials={project.credentials.map((c) => ({
            id: c.id,
            name: c.name,
            prefix: c.prefix,
            createdAt: c.createdAt.toISOString(),
            lastUsedAt: c.lastUsedAt?.toISOString() ?? null,
          }))}
        />

        <div className="card p-5">
          <h2 className="text-sm font-semibold">Recent license events</h2>
          {project.licenseEvents.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-subtle)]">No events yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {project.licenseEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3">
                  <span className="text-[var(--color-muted)]">
                    <span className="font-medium text-[var(--color-ink)]">{e.type}</span>
                    {e.fromStatus && e.toStatus ? ` · ${e.fromStatus} → ${e.toStatus}` : ""}
                  </span>
                  <span className="text-xs text-[var(--color-subtle)] whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5 border-[var(--color-danger-line)]">
          <h2 className="text-sm font-semibold text-[var(--color-danger)]">Archive project</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Hides the project and stops serving its license checks. This does not
            delete history.
          </p>
          <form action={archiveProjectAction.bind(null, project.id)} className="mt-3">
            <button type="submit" className="btn btn-danger btn-sm">Archive project</button>
          </form>
        </div>
      </div>
    </div>
  );
}
