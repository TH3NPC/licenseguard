"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { settingsSchema } from "@/lib/validation";
import { ActionState, zodFieldErrors } from "@/lib/action-state";

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse({
    name: formData.get("name") || undefined,
    defaultPortfolioUrl: formData.get("defaultPortfolioUrl") || undefined,
    defaultWatermarkText: formData.get("defaultWatermarkText") || undefined,
    defaultWatermarkStyle: formData.get("defaultWatermarkStyle") || undefined,
  });
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: d.name ?? undefined,
      defaultPortfolioUrl:
        d.defaultPortfolioUrl !== undefined ? d.defaultPortfolioUrl || null : undefined,
      defaultWatermarkText: d.defaultWatermarkText ?? undefined,
      defaultWatermarkStyle: d.defaultWatermarkStyle ?? undefined,
    },
  });
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Settings saved." };
}
