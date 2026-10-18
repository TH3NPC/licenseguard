"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import {
  createProjectForOwner,
  updateProjectForOwner,
  archiveProjectForOwner,
} from "@/lib/projects";
import { projectCreateSchema, projectUpdateSchema } from "@/lib/validation";
import { ActionState, zodFieldErrors } from "@/lib/action-state";

function parseConfig(formData: FormData) {
  const domainsRaw = String(formData.get("domains") ?? "");
  const domains = domainsRaw
    .split(/[\n,]/)
    .map((d) => d.trim())
    .filter(Boolean);

  const watermark = {
    style: String(formData.get("watermark.style") ?? "diagonal"),
    text: String(formData.get("watermark.text") ?? ""),
    opacity: Number(formData.get("watermark.opacity") ?? 0.16),
    size: String(formData.get("watermark.size") ?? "md"),
    placement: String(formData.get("watermark.placement") ?? "full"),
    contactUrl: String(formData.get("watermark.contactUrl") ?? ""),
    showContactLink: formData.get("watermark.showContactLink") === "on",
  };

  const preview = {
    mode: String(formData.get("preview.mode") ?? "links"),
    redirectUrl: String(formData.get("preview.redirectUrl") ?? ""),
    selector: String(formData.get("preview.selector") ?? ""),
    allowSelector: String(formData.get("preview.allowSelector") ?? ""),
    notice: String(formData.get("preview.notice") ?? ""),
  };

  return {
    name: String(formData.get("name") ?? "").trim(),
    websiteUrl: String(formData.get("websiteUrl") ?? "").trim(),
    environment: String(formData.get("environment") ?? "development"),
    domains,
    watermark,
    preview,
  };
}

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = projectCreateSchema.safeParse(parseConfig(formData));
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const project = await createProjectForOwner(user.id, parsed.data);
  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${project.id}`);
}

export async function updateProjectAction(
  projectId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = projectUpdateSchema.safeParse(parseConfig(formData));
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const updated = await updateProjectForOwner(user.id, projectId, parsed.data);
  if (!updated) return { error: "Project not found." };
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { ok: true, message: "Changes saved." };
}

export async function archiveProjectAction(projectId: string): Promise<void> {
  const user = await requireUser();
  await archiveProjectForOwner(user.id, projectId);
  revalidatePath("/dashboard");
  redirect("/dashboard/projects");
}
