import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import { User } from "@/lib/models";
import { verifyPassword, setSession } from "@/lib/auth";
import { isEmail, rateLimit, clientIp, sameOrigin } from "@/lib/guard";

// Node.js runtime required (mongoose / bcrypt / node:crypto / razorpay are not Edge-compatible).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "bad origin" }, { status: 403 });
  const ip = clientIp(req);
  // Brute-force protection: limit attempts per IP.
  if (!rateLimit(`login:${ip}`, 10, 60_000))
    return NextResponse.json({ error: "Too many attempts. Please wait a minute and try again." }, { status: 429 });

  const { email, password } = await req.json();
  if (!isEmail(email) || typeof password !== "string" || !password)
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });

  await dbConnect();
  const user = await User.findOne({ email: email.toLowerCase() });
  // Always run a compare to avoid leaking which emails exist (timing).
  const ok = user ? await verifyPassword(password, user.passwordHash) : await verifyPassword(password, "$2a$12$0000000000000000000000000000000000000000000000000000");
  if (!user || !ok)
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });

  await setSession(user._id.toString()); // 30-day session
  return NextResponse.json({ ok: true, user: { email: user.email } });
}
