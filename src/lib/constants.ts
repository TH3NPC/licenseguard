/**
 * Centralized enum-like constants. SQLite has no native enum type, so these
 * string unions are the single source of truth, enforced by zod at the
 * application boundary.
 */

export const APP_NAME = "ZER";

export const LICENSE_STATUS = {
  UNPAID_PREVIEW: "unpaid_preview",
  ACTIVE: "active",
  EXPIRED: "expired",
  REVOKED: "revoked",
  SUSPENDED: "suspended",
} as const;
export type LicenseStatus = (typeof LICENSE_STATUS)[keyof typeof LICENSE_STATUS];
export const LICENSE_STATUSES = Object.values(LICENSE_STATUS) as LicenseStatus[];

export const PROJECT_STATUS = {
  ACTIVE: "active",
  DISABLED: "disabled",
  ARCHIVED: "archived",
} as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];
export const PROJECT_STATUSES = Object.values(PROJECT_STATUS) as ProjectStatus[];

export const ENVIRONMENT = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
} as const;
export type Environment = (typeof ENVIRONMENT)[keyof typeof ENVIRONMENT];
export const ENVIRONMENTS = Object.values(ENVIRONMENT) as Environment[];

export const WATERMARK_STYLE = {
  DIAGONAL: "diagonal", // repeated diagonal tiles
  CENTER: "center", // large central stamp
  LAYER: "layer", // fixed translucent full-page layer
  BANNER: "banner", // compact top/bottom bar
} as const;
export type WatermarkStyle =
  (typeof WATERMARK_STYLE)[keyof typeof WATERMARK_STYLE];
export const WATERMARK_STYLES = Object.values(
  WATERMARK_STYLE,
) as WatermarkStyle[];

export const WATERMARK_PLACEMENT = {
  TOP: "top",
  BOTTOM: "bottom",
  CENTER: "center",
  FULL: "full",
} as const;
export type WatermarkPlacement =
  (typeof WATERMARK_PLACEMENT)[keyof typeof WATERMARK_PLACEMENT];
export const WATERMARK_PLACEMENTS = Object.values(
  WATERMARK_PLACEMENT,
) as WatermarkPlacement[];

/**
 * Preview interaction mode — what the SDK does with clicks when a project is
 * in unpaid-preview mode.
 *   off      -> no interception (watermark only)
 *   links    -> intercept ordinary <a> navigations
 *   selected -> intercept only elements matching a selector / data attribute
 *   strict   -> intercept all ordinary clicks (explicitly opt-in, documented)
 */
export const PREVIEW_MODE = {
  OFF: "off",
  LINKS: "links",
  SELECTED: "selected",
  STRICT: "strict",
} as const;
export type PreviewMode = (typeof PREVIEW_MODE)[keyof typeof PREVIEW_MODE];
export const PREVIEW_MODES = Object.values(PREVIEW_MODE) as PreviewMode[];

export const DEFAULT_WATERMARK_TEXT = "UNPAID PREVIEW — CONTACT TO PURCHASE";

export const LICENSE_EVENT_TYPE = {
  CREATED: "created",
  ACTIVATED: "activated",
  RENEWED: "renewed",
  EXPIRED: "expired",
  REVOKED: "revoked",
  SUSPENDED: "suspended",
  REINSTATED: "reinstated",
} as const;
export type LicenseEventType =
  (typeof LICENSE_EVENT_TYPE)[keyof typeof LICENSE_EVENT_TYPE];

/** Short-lived cache window the SDK/client may honor for a license response. */
export const LICENSE_RESPONSE_TTL_SECONDS = 60;
