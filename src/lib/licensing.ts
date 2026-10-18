import {
  LICENSE_STATUS,
  LicenseStatus,
  LICENSE_RESPONSE_TTL_SECONDS,
} from "./constants";

/**
 * Core licensing logic. These functions are intentionally pure (no DB, no I/O)
 * so they are trivially unit-testable and can be reasoned about in isolation.
 *
 * The golden rule: the EFFECTIVE status is always derived on the server from
 * the stored status plus the clock. A stored "active" license whose expiry has
 * passed is effectively "expired" — we never trust a stale stored value and
 * never trust anything the browser sends.
 */

export interface LicenseLike {
  status: string;
  activatedAt?: Date | null;
  expiresAt?: Date | null;
}

/** Statuses in which the protected/licensed experience is shown (no watermark). */
export function isLicensedStatus(status: LicenseStatus): boolean {
  return status === LICENSE_STATUS.ACTIVE;
}

/**
 * Derive the effective license status from stored state + current time.
 * An ACTIVE license past its expiry becomes EXPIRED. All other statuses are
 * returned as-is (revoked/suspended/unpaid never silently "upgrade").
 */
export function effectiveStatus(
  license: LicenseLike | null | undefined,
  now: Date = new Date(),
): LicenseStatus {
  if (!license) return LICENSE_STATUS.UNPAID_PREVIEW;

  const status = normalizeStatus(license.status);

  if (status === LICENSE_STATUS.ACTIVE) {
    if (license.expiresAt && license.expiresAt.getTime() <= now.getTime()) {
      return LICENSE_STATUS.EXPIRED;
    }
    return LICENSE_STATUS.ACTIVE;
  }

  return status;
}

/** Whether the watermark/preview restrictions should be shown for a license. */
export function shouldWatermark(
  license: LicenseLike | null | undefined,
  now: Date = new Date(),
): boolean {
  return !isLicensedStatus(effectiveStatus(license, now));
}

function normalizeStatus(value: string): LicenseStatus {
  const v = value as LicenseStatus;
  switch (v) {
    case LICENSE_STATUS.ACTIVE:
    case LICENSE_STATUS.EXPIRED:
    case LICENSE_STATUS.REVOKED:
    case LICENSE_STATUS.SUSPENDED:
    case LICENSE_STATUS.UNPAID_PREVIEW:
      return v;
    default:
      // Unknown/corrupt stored value fails safe to the most restrictive state.
      return LICENSE_STATUS.UNPAID_PREVIEW;
  }
}

/**
 * Allowed administrative transitions. Prevents nonsense moves like reviving a
 * revoked license by "expiring" it, and documents the lifecycle explicitly.
 */
const TRANSITIONS: Record<LicenseStatus, LicenseStatus[]> = {
  [LICENSE_STATUS.UNPAID_PREVIEW]: [
    LICENSE_STATUS.ACTIVE,
    LICENSE_STATUS.SUSPENDED,
    LICENSE_STATUS.REVOKED,
  ],
  [LICENSE_STATUS.ACTIVE]: [
    LICENSE_STATUS.EXPIRED,
    LICENSE_STATUS.REVOKED,
    LICENSE_STATUS.SUSPENDED,
    LICENSE_STATUS.ACTIVE, // renewal (new expiry)
  ],
  [LICENSE_STATUS.EXPIRED]: [LICENSE_STATUS.ACTIVE, LICENSE_STATUS.REVOKED],
  [LICENSE_STATUS.SUSPENDED]: [
    LICENSE_STATUS.ACTIVE,
    LICENSE_STATUS.REVOKED,
    LICENSE_STATUS.UNPAID_PREVIEW,
  ],
  [LICENSE_STATUS.REVOKED]: [LICENSE_STATUS.ACTIVE], // explicit reinstatement only
};

export function canTransition(
  from: LicenseStatus,
  to: LicenseStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * The minimal public payload returned to the SDK. Deliberately leaks nothing
 * about the owner, revenue, or internal ids beyond what the browser needs to
 * render the correct experience.
 */
export interface PublicLicenseResponse {
  projectId: string;
  licensed: boolean;
  status: LicenseStatus;
  expiresAt: string | null;
  // Watermark/preview config the SDK needs when unlicensed; null when licensed.
  preview: unknown | null;
  // Seconds the client may cache this response.
  ttl: number;
}

export function buildPublicResponse(args: {
  publicId: string;
  license: LicenseLike | null | undefined;
  previewConfig: unknown;
  now?: Date;
}): PublicLicenseResponse {
  const now = args.now ?? new Date();
  const status = effectiveStatus(args.license, now);
  const licensed = isLicensedStatus(status);
  return {
    projectId: args.publicId,
    licensed,
    status,
    expiresAt: args.license?.expiresAt
      ? args.license.expiresAt.toISOString()
      : null,
    preview: licensed ? null : args.previewConfig,
    ttl: LICENSE_RESPONSE_TTL_SECONDS,
  };
}
