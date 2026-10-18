"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import {
  activateLicenseForOwner,
  revokeLicenseForOwner,
  suspendLicenseForOwner,
} from "@/lib/licenses";
import { licenseActivateSchema } from "@/lib/validation";
import { ActionState } from "@/lib/action-state";

export async function activateLicenseAction(
  projectId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const durationRaw = formData.get("durationDays");
  const parsed = licenseActivateSchema.safeParse({
    durationDays: durationRaw ? Number(durationRaw) : undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: "Enter a valid duration in days." };
  }
  const res = await activateLicenseForOwner(
    user.id,
    projectId,
    parsed.data,
    user.id,
  );
  if (!res.ok) {
    return {
      error:
        res.reason === "invalid_transition"
          ? "This license cannot be activated from its current state."
          : "Project not found.",
    };
  }
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { ok: true, message: "License activated." };
}

export async function revokeLicenseAction(projectId: string): Promise<void> {
  const user = await requireUser();
  await revokeLicenseForOwner(user.id, projectId, user.id);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function suspendLicenseAction(projectId: string): Promise<void> {
  const user = await requireUser();
  await suspendLicenseForOwner(user.id, projectId, user.id);
  revalidatePath(`/dashboard/projects/${projectId}`);
}
