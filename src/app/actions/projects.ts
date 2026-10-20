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
import { normalizeDomain } from "@/lib/origin";

function parseConfig(formData: FormData) {
  // Accept "client.com" as well as a full URL; add https:// when it's missing.
  let websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) websiteUrl = `https://${websiteUrl}`;

  // People paste full URLs ("https://client.com/") here too — reduce each line
  // to its bare domain. Unparseable lines are kept as-is so validation flags them.
  const domainsRaw = String(formData.get("domains") ?? "");
  const domains = domainsRaw
    .split(/[\n,]/)
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => normalizeDomain(d) ?? d);

  // No domains given: allow the project's own website automatically.
  const siteHost = websiteUrl ? normalizeDomain(websiteUrl) : null;
  if (domains.length === 0 && siteHost) domains.push(siteHost);

  const watermark = {
    style: String(formData.get("watermark.style") ?? "diagonal"),
    theme: String(formData.get("watermark.theme") ?? "auto"),
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
    websiteUrl,
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
  redirect(`/dashboard/projects/${project.id}?tab=setup`);
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
