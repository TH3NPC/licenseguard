export interface ActionState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  /** Opaque payload some actions return (e.g. a one-time secret). */
  data?: unknown;
}

export const emptyState: ActionState = {};

/** Flatten a zod error into a field->message map for form display. */
export function zodFieldErrors(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path[0];
    if (key != null && out[String(key)] === undefined) {
      out[String(key)] = i.message;
    }
  }
  return out;
}
