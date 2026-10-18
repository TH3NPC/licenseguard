"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import {
  createApiCredentialForOwner,
  revokeApiCredentialForOwner,
} from "@/lib/api-credentials";
import { ActionState } from "@/lib/action-state";

export async function createCredentialAction(
  projectId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "Server key").slice(0, 100);
  const result = await createApiCredentialForOwner(user.id, projectId, name);
  if (!result) return { error: "Project not found." };
  revalidatePath(`/dashboard/projects/${projectId}`);
  // The plaintext secret is returned exactly once for display.
  return {
    ok: true,
    message: "Credential created. Copy it now — it will not be shown again.",
    data: { secret: result.secret, prefix: result.credential.prefix },
  };
}

export async function revokeCredentialAction(
  projectId: string,
  credentialId: string,
): Promise<void> {
  const user = await requireUser();
  await revokeApiCredentialForOwner(user.id, projectId, credentialId);
  revalidatePath(`/dashboard/projects/${projectId}`);
}
