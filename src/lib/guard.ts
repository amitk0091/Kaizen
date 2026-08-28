import { NextRequest, NextResponse } from "next/server";
import { User } from "./models";
import { getOrCreateSubscription, isEntitled } from "./subscription";

/**
 * Server-side entitlement check. This is the ONLY source of truth for access —
 * the client UI paywall is just for UX. Every mutating / paid endpoint calls
 * this so the trial/subscription cannot be bypassed by hitting the API directly.
 * Requires dbConnect() to have been called first.
 */
export async function isEntitledUser(uid: string): Promise<boolean> {
  const user = await User.findById(uid);
  if (!user) return false;
  const sub = await getOrCreateSubscription(uid, user.trialStart);
  return isEntitled(sub);
}

/** Standard 402 response used when the trial has ended / subscription lapsed. */
export function paywallResponse() {
  return NextResponse.json(
    {
      error:
        "Your free trial has ended. Upgrade to Kaizen Pro to keep creating and syncing.",
      code: "PAYMENT_REQUIRED",
    },
    { status: 402 },
  );
}

/**
 * CSRF defense-in-depth. Cookies are SameSite=Lax, but we also reject
 * cross-origin write requests whose Origin does not match the host.
 */
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches may omit Origin
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** In-memory sliding-window rate limiter.
 *  NOTE: per-instance only. For multi-instance/serverless production, back this
 *  with Upstash Redis (see README). Good enough to blunt brute-force on a
 *  single instance and in dev. */
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(id: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(id);
  if (!b || b.reset < now) {
    buckets.set(id, { count: 1, reset: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}
export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Basic validators (also acts as NoSQL-injection defense: forces strings). */
export function isEmail(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) &&
    v.length <= 254
  );
}
export function isValidPassword(v: unknown): v is string {
  return typeof v === "string" && v.length >= 8 && v.length <= 200;
}
