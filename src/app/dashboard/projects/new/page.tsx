import Link from "next/link";
import { requireUser } from "@/lib/session";
import { ProjectForm } from "@/components/ProjectForm";
import { createProjectAction } from "@/app/actions/projects";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const user = await requireUser();

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <Link href="/dashboard/projects" className="text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--ink)]">
          ← Projects
        </Link>
        <h1 className="mt-1 text-[1.75rem]">Create project</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Only a name is required — everything else has sensible defaults. You&apos;ll
          get the script to paste right after saving.
        </p>
      </div>

      <ProjectForm
        mode="create"
        action={createProjectAction}
        defaults={{
          watermark: {
            text: user.defaultWatermarkText,
            style: user.defaultWatermarkStyle as never,
            contactUrl: user.defaultPortfolioUrl ?? "",
          },
          preview: { redirectUrl: user.defaultPortfolioUrl ?? "" },
        }}
      />
    </div>
  );
}
