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

const TABS = [
  { id: "license", label: "License" },
  { id: "setup", label: "Setup" },
  { id: "settings", label: "Settings" },
  { id: "keys", label: "API keys" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: TabId = TABS.some((t) => t.id === rawTab) ? (rawTab as TabId) : "license";

  const user = await requireUser();
  const project = await getProjectForOwner(user.id, id);
  if (!project) notFound();

  const effective = effectiveStatus(project.license, new Date());
  const staleActive =
    effective === LICENSE_STATUS.EXPIRED && project.license?.status === LICENSE_STATUS.ACTIVE;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5">
        <Link href="/dashboard/projects" className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]">
          ← Projects
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[1.75rem] truncate">{project.name}</h1>
              <StatusBadge status={effective} />
            </div>
            <div className="mt-1 flex items-center gap-1">
              <code className="mono text-[var(--muted)]">{project.publicId}</code>
              <CopyButton value={project.publicId} label="Copy id" className="btn btn-ghost btn-sm" />
            </div>
            {staleActive ? (
              <p className="mt-1 text-xs text-[var(--warn)]">
                Marked active but past its expiry — visitors see the watermark again.
              </p>
            ) : null}
          </div>
          <a
            href={`/preview/${project.publicId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Open live preview ↗
          </a>
        </div>
      </div>

      {/* Tabs */}
      <nav className="tabs" aria-label="Project sections">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/projects/${project.id}?tab=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className="tab"
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "license" ? (
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <LicensePanel
            projectId={project.id}
            effective={effective}
            storedStatus={project.license?.status ?? "unpaid_preview"}
            activatedAt={project.license?.activatedAt?.toISOString() ?? null}
            expiresAt={project.license?.expiresAt?.toISOString() ?? null}
            note={project.license?.note ?? null}
          />
          <div className="card">
            <div className="px-5 pt-5 pb-3 box-title">Activity</div>
            {project.licenseEvents.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-[var(--subtle)]">No activity yet.</p>
            ) : (
              <ul className="border-t border-[var(--line)] divide-y divide-[var(--line)]">
                {project.licenseEvents.map((e) => (
                  <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <span className="text-sm">
                      <span className="font-semibold capitalize">{e.type}</span>
                      {e.fromStatus && e.toStatus ? (
                        <span className="text-[var(--subtle)]"> · {e.fromStatus.replace("_", " ")} → {e.toStatus.replace("_", " ")}</span>
                      ) : null}
                    </span>
                    <span className="text-xs text-[var(--subtle)] whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {tab === "setup" ? <IntegrationPanel publicId={project.publicId} /> : null}

      {tab === "settings" ? (
        <>
          <ProjectForm
            mode="edit"
            action={updateProjectAction.bind(null, project.id)}
            defaults={{
              name: project.name,
              websiteUrl: project.websiteUrl ?? "",
              environment: project.environment,
              domains: project.domains.map((d) => d.domain),
              watermark: parseWatermarkConfig(project.watermarkConfig),
              preview: parsePreviewConfig(project.previewConfig),
            }}
          />
          <div className="card p-5 flex flex-wrap items-center justify-between gap-3 border-[var(--danger-line)]">
            <div>
              <div className="box-title text-[var(--danger)]">Archive project</div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Hides it and stops its license checks. History is kept.
              </p>
            </div>
            <form action={archiveProjectAction.bind(null, project.id)}>
              <button type="submit" className="btn btn-danger">Archive</button>
            </form>
          </div>
        </>
      ) : null}

      {tab === "keys" ? (
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
      ) : null}
    </div>
  );
}
