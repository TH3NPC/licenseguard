import "server-only";
import { prisma } from "./prisma";
import { createCredential, hashSecret } from "./credentials";
import { recordAudit } from "./audit";

/**
 * Server-side API credential management. The plaintext secret is returned to
 * the caller ONCE (at creation/rotation) and never stored or logged. Only the
 * SHA-256 hash and a non-secret prefix are persisted.
 */

export async function createApiCredentialForOwner(
  ownerId: string,
  projectId: string,
  name: string,
) {
  const owns = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
    select: { id: true },
  });
  if (!owns) return null;

  const { secret, prefix, tokenHash } = createCredential();
  const credential = await prisma.apiCredential.create({
    data: { projectId, name: name || "Server key", prefix, tokenHash },
    select: { id: true, name: true, prefix: true, createdAt: true },
  });

  await recordAudit({
    userId: ownerId,
    action: "api_credential.create",
    targetType: "project",
    targetId: projectId,
    metadata: { credentialId: credential.id },
  });

  // secret is returned exactly once.
  return { credential, secret };
}

export async function revokeApiCredentialForOwner(
  ownerId: string,
  projectId: string,
  credentialId: string,
) {
  // Ensure the credential belongs to a project owned by this user.
  const cred = await prisma.apiCredential.findFirst({
    where: { id: credentialId, projectId, project: { ownerId } },
    select: { id: true },
  });
  if (!cred) return false;

  await prisma.apiCredential.update({
    where: { id: credentialId },
    data: { status: "revoked", revokedAt: new Date() },
  });
  await recordAudit({
    userId: ownerId,
    action: "api_credential.revoke",
    targetType: "project",
    targetId: projectId,
    metadata: { credentialId },
  });
  return true;
}

/** Rotate = revoke the old credential and issue a new one atomically-ish. */
export async function rotateApiCredentialForOwner(
  ownerId: string,
  projectId: string,
  credentialId: string,
  name: string,
) {
  const revoked = await revokeApiCredentialForOwner(
    ownerId,
    projectId,
    credentialId,
  );
  if (!revoked) return null;
  return createApiCredentialForOwner(ownerId, projectId, name);
}

/**
 * Authenticate a server-to-server request bearing an API secret. Returns the
 * owning project id on success. Used by trusted integration endpoints — NOT by
 * the public SDK (which only sends the public project id).
 */
export async function authenticateApiSecret(secret: string) {
  if (!secret || !secret.startsWith("lg_sk_")) return null;
  const tokenHash = hashSecret(secret);
  const cred = await prisma.apiCredential.findFirst({
    where: { tokenHash, status: "active" },
    select: { id: true, projectId: true },
  });
  if (!cred) return null;

  await prisma.apiCredential.update({
    where: { id: cred.id },
    data: { lastUsedAt: new Date() },
  });
  return { projectId: cred.projectId, credentialId: cred.id };
}
