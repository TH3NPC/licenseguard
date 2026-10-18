import { describe, it, expect } from "vitest";
import {
  effectiveStatus,
  shouldWatermark,
  canTransition,
  buildPublicResponse,
  isLicensedStatus,
} from "@/lib/licensing";
import { LICENSE_STATUS } from "@/lib/constants";

const now = new Date("2026-01-01T00:00:00Z");
const past = new Date("2025-12-01T00:00:00Z");
const future = new Date("2026-02-01T00:00:00Z");

describe("effectiveStatus", () => {
  it("returns unpaid_preview when there is no license", () => {
    expect(effectiveStatus(null, now)).toBe(LICENSE_STATUS.UNPAID_PREVIEW);
  });

  it("keeps an active license active before expiry", () => {
    expect(
      effectiveStatus({ status: "active", expiresAt: future }, now),
    ).toBe(LICENSE_STATUS.ACTIVE);
  });

  it("treats an active license past expiry as expired", () => {
    expect(
      effectiveStatus({ status: "active", expiresAt: past }, now),
    ).toBe(LICENSE_STATUS.EXPIRED);
  });

  it("keeps an active license with no expiry active", () => {
    expect(effectiveStatus({ status: "active", expiresAt: null }, now)).toBe(
      LICENSE_STATUS.ACTIVE,
    );
  });

  it("does not resurrect revoked or suspended licenses", () => {
    expect(effectiveStatus({ status: "revoked" }, now)).toBe(LICENSE_STATUS.REVOKED);
    expect(effectiveStatus({ status: "suspended" }, now)).toBe(LICENSE_STATUS.SUSPENDED);
  });

  it("fails safe to unpaid_preview on a corrupt stored status", () => {
    expect(effectiveStatus({ status: "garbage" }, now)).toBe(LICENSE_STATUS.UNPAID_PREVIEW);
  });
});

describe("shouldWatermark / isLicensedStatus", () => {
  it("watermarks everything except an effectively-active license", () => {
    expect(shouldWatermark({ status: "active", expiresAt: future }, now)).toBe(false);
    expect(shouldWatermark({ status: "active", expiresAt: past }, now)).toBe(true);
    expect(shouldWatermark(null, now)).toBe(true);
    expect(shouldWatermark({ status: "revoked" }, now)).toBe(true);
  });
  it("only active counts as licensed", () => {
    expect(isLicensedStatus(LICENSE_STATUS.ACTIVE)).toBe(true);
    expect(isLicensedStatus(LICENSE_STATUS.EXPIRED)).toBe(false);
  });
});

describe("canTransition", () => {
  it("allows activating from unpaid and expired", () => {
    expect(canTransition(LICENSE_STATUS.UNPAID_PREVIEW, LICENSE_STATUS.ACTIVE)).toBe(true);
    expect(canTransition(LICENSE_STATUS.EXPIRED, LICENSE_STATUS.ACTIVE)).toBe(true);
  });
  it("allows reinstating a revoked license only via active", () => {
    expect(canTransition(LICENSE_STATUS.REVOKED, LICENSE_STATUS.ACTIVE)).toBe(true);
    expect(canTransition(LICENSE_STATUS.REVOKED, LICENSE_STATUS.EXPIRED)).toBe(false);
  });
  it("rejects nonsense transitions", () => {
    expect(canTransition(LICENSE_STATUS.UNPAID_PREVIEW, LICENSE_STATUS.EXPIRED)).toBe(false);
  });
});

describe("buildPublicResponse", () => {
  it("hides preview config when licensed", () => {
    const r = buildPublicResponse({
      publicId: "lg_pub_x",
      license: { status: "active", expiresAt: future },
      previewConfig: { watermark: {}, preview: {} },
      now,
    });
    expect(r.licensed).toBe(true);
    expect(r.preview).toBeNull();
    expect(r.expiresAt).toBe(future.toISOString());
    expect(r.ttl).toBeGreaterThan(0);
  });

  it("includes preview config when unlicensed", () => {
    const cfg = { watermark: { text: "X" }, preview: { mode: "links" } };
    const r = buildPublicResponse({
      publicId: "lg_pub_x",
      license: null,
      previewConfig: cfg,
      now,
    });
    expect(r.licensed).toBe(false);
    expect(r.status).toBe(LICENSE_STATUS.UNPAID_PREVIEW);
    expect(r.preview).toEqual(cfg);
  });
});
