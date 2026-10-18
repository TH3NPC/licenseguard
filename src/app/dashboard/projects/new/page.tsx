import Link from "next/link";
import { requireUser } from "@/lib/session";
import { ProjectForm } from "@/components/ProjectForm";
import { createProjectAction } from "@/app/actions/projects";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const user = await requireUser();

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <Link href="/dashboard/projects" className="text-sm text-[var(--color-muted)] underline-offset-2 hover:underline">
          ← Projects
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Create project</h1>
        <p className="text-sm text-[var(--color-muted)]">
          A public project id and integration snippet are generated on save.
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
