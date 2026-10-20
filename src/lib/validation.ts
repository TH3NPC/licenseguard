import { z } from "zod";
import {
  ENVIRONMENTS,
  PREVIEW_MODES,
  WATERMARK_PLACEMENTS,
  WATERMARK_STYLES,
  DEFAULT_WATERMARK_TEXT,
} from "./constants";

/**
 * Zod schemas are the application-layer enforcement of the "enum" string
 * unions and all user input. Everything crossing an API boundary is parsed
 * here before it touches the database.
 */

export const watermarkConfigSchema = z.object({
  style: z.enum(WATERMARK_STYLES as [string, ...string[]]).default("diagonal"),
  // auto = detect the site's background; light = for light sites (dark ink);
  // dark = for dark sites (light ink).
  theme: z.enum(["auto", "light", "dark"]).default("auto"),
  text: z.string().trim().min(1).max(120).default(DEFAULT_WATERMARK_TEXT),
  opacity: z.number().min(0.03).max(0.7).default(0.2),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  placement: z
    .enum(WATERMARK_PLACEMENTS as [string, ...string[]])
    .default("full"),
  contactUrl: z.string().url().max(2048).optional().or(z.literal("")),
  showContactLink: z.boolean().default(true),
});
export type WatermarkConfig = z.infer<typeof watermarkConfigSchema>;

export const previewConfigSchema = z.object({
  mode: z.enum(PREVIEW_MODES as [string, ...string[]]).default("links"),
  redirectUrl: z.string().url().max(2048).optional().or(z.literal("")),
  selector: z.string().trim().max(500).optional().or(z.literal("")),
  allowSelector: z.string().trim().max(500).optional().or(z.literal("")),
  notice: z.string().trim().max(240).optional().or(z.literal("")),
});
export type PreviewConfig = z.infer<typeof previewConfigSchema>;

const domainSchema = z
  .string()
  .trim()
  .min(1)
  .max(253)
  .regex(/^(\*|\*\.)?[a-z0-9.-]+$/i, "Invalid domain");

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  websiteUrl: z.string().url().max(2048).optional().or(z.literal("")),
  environment: z
    .enum(ENVIRONMENTS as [string, ...string[]])
    .default("development"),
  domains: z.array(domainSchema).max(50).default([]),
  // Optional here; the write path defaults them and the read path normalizes
  // via parseWatermarkConfig/parsePreviewConfig. (Avoids zod 3.25 `.default()`
  // object-typing friction.)
  watermark: watermarkConfigSchema.optional(),
  preview: previewConfigSchema.optional(),
});
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

export const projectUpdateSchema = projectCreateSchema.partial().extend({
  status: z.enum(["active", "disabled", "archived"]).optional(),
});
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export const licenseActivateSchema = z.object({
  // Duration in days; or an explicit expiry date. One of them.
  durationDays: z.number().int().min(1).max(3650).optional(),
  expiresAt: z.string().datetime().optional(),
  note: z.string().trim().max(500).optional(),
});
export type LicenseActivateInput = z.infer<typeof licenseActivateSchema>;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(200),
  name: z.string().trim().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export const settingsSchema = z.object({
  name: z.string().trim().max(100).optional(),
  defaultPortfolioUrl: z.string().url().max(2048).optional().or(z.literal("")),
  defaultWatermarkText: z.string().trim().min(1).max(120).optional(),
  defaultWatermarkStyle: z
    .enum(WATERMARK_STYLES as [string, ...string[]])
    .optional(),
});

/** Safely parse a stored JSON config string, falling back to schema defaults. */
export function parseWatermarkConfig(raw: string | null | undefined): WatermarkConfig {
  return safeParse(watermarkConfigSchema, raw);
}
export function parsePreviewConfig(raw: string | null | undefined): PreviewConfig {
  return safeParse(previewConfigSchema, raw);
}

// Accept any schema (input/output types may differ because of `.default()`),
// returning the schema's output type.
function safeParse<S extends z.ZodTypeAny>(
  schema: S,
  raw: string | null | undefined,
): z.infer<S> {
  try {
    const obj = raw ? JSON.parse(raw) : {};
    const result = schema.safeParse(obj);
    if (result.success) return result.data;
  } catch {
    // fall through to defaults
  }
  return schema.parse({});
}
