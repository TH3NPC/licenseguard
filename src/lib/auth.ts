import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { serverEnv } from "./env";

/**
 * Authentication primitives: password hashing (bcrypt, appropriate for human
 * passwords) and stateless session tokens (signed JWT via jose). No Next.js
 * imports here so this module is unit-testable in isolation.
 */

const BCRYPT_ROUNDS = 12;
const SESSION_TTL = "7d";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionPayload {
  userId: string;
  email: string;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(serverEnv.authSecret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey());
}

export async function verifySession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub || typeof payload.email !== "string") return null;
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
