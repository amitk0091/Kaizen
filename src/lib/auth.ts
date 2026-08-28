import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_DAYS = parseInt(process.env.SESSION_DAYS || "30", 10);
const COOKIE = "kaizen_session";
const BCRYPT_ROUNDS = 12;

/** Resolve the signing secret. In production a strong secret is MANDATORY —
 *  a missing/weak one would let anyone forge session tokens (account takeover),
 *  so we fail hard instead of silently using a dev default. */
function secret(): Uint8Array {
  const s = process.env.JWT_SECRET || "";
  if (process.env.NODE_ENV === "production") {
    if (!s || s.length < 32) {
      throw new Error("JWT_SECRET must be set to a strong value (>= 32 chars) in production.");
    }
  }
  return new TextEncoder().encode(s || "dev-insecure-secret-change-me-please-32+chars");
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, BCRYPT_ROUNDS);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

/** Create a signed session token valid for SESSION_DAYS (>= 1 month per spec). */
export async function createToken(userId: string) {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function readToken(token?: string) {
  if (!token) return null;
  try {
    // Pin the algorithm to prevent alg-confusion attacks.
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload as { uid: string };
  } catch {
    return null;
  }
}

/** Long-lived, httpOnly, secure session cookie (sliding: refreshed on activity). */
export function sessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export async function setSession(userId: string) {
  const token = await createToken(userId);
  cookies().set(COOKIE, token, sessionCookieOptions());
}
export function clearSession() {
  cookies().set(COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
}

/** Read the current user id from the request cookie (for route handlers). */
export async function getUserId(req?: NextRequest): Promise<string | null> {
  const token = req ? req.cookies.get(COOKIE)?.value : cookies().get(COOKIE)?.value;
  const payload = await readToken(token);
  return payload?.uid ?? null;
}

export const SESSION_COOKIE = COOKIE;
