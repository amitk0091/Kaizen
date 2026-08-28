import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import { User, UserState } from "@/lib/models";
import { hashPassword, setSession } from "@/lib/auth";
import { getOrCreateSubscription } from "@/lib/subscription";
import { defaultState } from "@/lib/types";
import { encryptJSON } from "@/lib/crypto";
import { isEmail, isValidPassword, rateLimit, clientIp, sameOrigin } from "@/lib/guard";

// Node.js runtime required (mongoose / bcrypt / node:crypto / razorpay are not Edge-compatible).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "bad origin" }, { status: 403 });
  const ip = clientIp(req);
  if (!rateLimit(`signup:${ip}`, 8, 60 * 60_000))
    return NextResponse.json({ error: "Too many sign-ups from this network. Try again later." }, { status: 429 });

  const { email, password } = await req.json();
  if (!isEmail(email))
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (!isValidPassword(password))
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  await dbConnect();
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return NextResponse.json({ error: "That email is already registered — try logging in." }, { status: 409 });

  const user = await User.create({ email: email.toLowerCase(), passwordHash: await hashPassword(password) });
  // Seed an encrypted empty state doc + trial subscription so the first load is instant.
  await UserState.create({ userId: user._id, data: encryptJSON(defaultState()) });
  await getOrCreateSubscription(user._id.toString(), user.trialStart);

  await setSession(user._id.toString()); // 30-day session cookie
  return NextResponse.json({ ok: true, user: { email: user.email } });
}
