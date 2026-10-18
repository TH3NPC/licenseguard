import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createProjectForOwner,
  getProjectForOwner,
  updateProjectForOwner,
  archiveProjectForOwner,
} from "@/lib/projects";
import { activateLicenseForOwner } from "@/lib/licenses";
import {
  createApiCredentialForOwner,
  revokeApiCredentialForOwner,
  authenticateApiSecret,
} from "@/lib/api-credentials";
import { effectiveStatus } from "@/lib/licensing";
import { projectCreateSchema } from "@/lib/validation";
import { LICENSE_STATUS } from "@/lib/constants";

async function clean() {
  await prisma.licenseEvent.deleteMany();
  await prisma.sdkUsage.deleteMany();
  await prisma.apiCredential.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany(); // cascades to projects/licenses/domains
}

async function makeUser(email: string) {
  return prisma.user.create({ data: { email, passwordHash: "x" } });
}

function input(name: string) {
  return projectCreateSchema.parse({ name, domains: ["example.com"] });
}

describe("project ownership & IDOR", () => {
  beforeEach(clean);

  it("creates a project with a public id and an unpaid-preview license", async () => {
    const a = await makeUser("a@test.dev");
    const p = await createProjectForOwner(a.id, input("Acme"));
    expect(p.publicId).toMatch(/^lg_pub_/);
    expect(p.license?.status).toBe(LICENSE_STATUS.UNPAID_PREVIEW);
  });

  it("prevents another user from reading, updating, or archiving a project", async () => {
    const a = await makeUser("a@test.dev");
    const b = await makeUser("b@test.dev");
    const p = await createProjectForOwner(a.id, input("Acme"));

    expect(await getProjectForOwner(a.id, p.id)).not.toBeNull();
    expect(await getProjectForOwner(b.id, p.id)).toBeNull();

    expect(await updateProjectForOwner(b.id, p.id, { name: "Hacked" })).toBeNull();
    expect(await archiveProjectForOwner(b.id, p.id)).toBe(false);

    // Owner can.
    const updated = await updateProjectForOwner(a.id, p.id, { name: "Acme 2" });
    expect(updated?.name).toBe("Acme 2");
  });
});

describe("license activation authorization", () => {
  beforeEach(clean);

  it("only the owner can activate, and activation sets an expiry", async () => {
    const a = await makeUser("a@test.dev");
    const b = await makeUser("b@test.dev");
    const p = await createProjectForOwner(a.id, input("Acme"));

    const denied = await activateLicenseForOwner(b.id, p.id, { durationDays: 30 }, b.id);
    expect(denied.ok).toBe(false);

    const ok = await activateLicenseForOwner(a.id, p.id, { durationDays: 30 }, a.id);
    expect(ok.ok).toBe(true);

    const fresh = await getProjectForOwner(a.id, p.id);
    expect(fresh?.license?.status).toBe(LICENSE_STATUS.ACTIVE);
    expect(effectiveStatus(fresh?.license, new Date())).toBe(LICENSE_STATUS.ACTIVE);
    expect(fresh?.license?.expiresAt).toBeTruthy();
  });
});

describe("API credential lifecycle", () => {
  beforeEach(clean);

  it("issues, authenticates, and revokes credentials with ownership checks", async () => {
    const a = await makeUser("a@test.dev");
    const b = await makeUser("b@test.dev");
    const p = await createProjectForOwner(a.id, input("Acme"));

    expect(await createApiCredentialForOwner(b.id, p.id, "x")).toBeNull();

    const created = await createApiCredentialForOwner(a.id, p.id, "Server");
    expect(created?.secret).toMatch(/^lg_sk_/);

    const auth = await authenticateApiSecret(created!.secret);
    expect(auth?.projectId).toBe(p.id);
    expect(await authenticateApiSecret("lg_sk_wrong")).toBeNull();

    // Another user cannot revoke it.
    expect(await revokeApiCredentialForOwner(b.id, p.id, created!.credential.id)).toBe(false);
    expect(await revokeApiCredentialForOwner(a.id, p.id, created!.credential.id)).toBe(true);

    // Revoked credential no longer authenticates.
    expect(await authenticateApiSecret(created!.secret)).toBeNull();
  });
});
