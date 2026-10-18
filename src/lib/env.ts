/**
 * Minimal, explicit environment access. Server-only secrets must never be
 * imported into client components — only the NEXT_PUBLIC_* values are safe
 * to reference from the browser.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const serverEnv = {
  get authSecret(): string {
    const v = required("AUTH_SECRET", process.env.AUTH_SECRET);
    if (v.length < 32) {
      throw new Error("AUTH_SECRET must be at least 32 characters.");
    }
    return v;
  },
  get databaseUrl(): string {
    return required("DATABASE_URL", process.env.DATABASE_URL);
  },
  get chapaSecretKey(): string | undefined {
    return process.env.CHAPA_SECRET_KEY || undefined;
  },
  get chapaWebhookSecret(): string | undefined {
    return process.env.CHAPA_WEBHOOK_SECRET || undefined;
  },
};

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
