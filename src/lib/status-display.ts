import { LICENSE_STATUS, type LicenseStatus } from "./constants";

type Tone = "ok" | "warn" | "danger" | "neutral";

const MAP: Record<LicenseStatus, { label: string; tone: Tone }> = {
  [LICENSE_STATUS.ACTIVE]: { label: "Active", tone: "ok" },
  [LICENSE_STATUS.UNPAID_PREVIEW]: { label: "Unpaid preview", tone: "warn" },
  [LICENSE_STATUS.EXPIRED]: { label: "Expired", tone: "warn" },
  [LICENSE_STATUS.REVOKED]: { label: "Revoked", tone: "danger" },
  [LICENSE_STATUS.SUSPENDED]: { label: "Suspended", tone: "neutral" },
};

export function licenseDisplay(status: string): { label: string; tone: Tone } {
  return MAP[status as LicenseStatus] ?? { label: status, tone: "neutral" };
}

export function badgeClass(tone: Tone): string {
  switch (tone) {
    case "ok":
      return "badge badge-ok";
    case "warn":
      return "badge badge-warn";
    case "danger":
      return "badge badge-danger";
    default:
      return "badge";
  }
}
