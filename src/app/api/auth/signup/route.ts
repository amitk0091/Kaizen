import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import { User, UserState } from "@/lib/models";
import { hashPassword, setSession } from "@/lib/auth";
import { getOrCreateSubscription } from "@/lib/subscription";
import { defaultState } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password || password.length < 6)
    return NextResponse.json({ error: "Enter a valid email and a password of at least 6 characters." }, { status: 400 });
  await dbConnect();
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return NextResponse.json({ error: "That email is already registered — try logging in." }, { status: 409 });

  const user = await User.create({ email: email.toLowerCase(), passwordHash: await hashPassword(password) });
  // Seed an empty state doc + trial subscription so the first load is instant.
  await UserState.create({ userId: user._id, data: defaultState() });
  await getOrCreateSubscription(user._id.toString(), user.trialStart);

  await setSession(user._id.toString()); // 30-day session cookie
  return NextResponse.json({ ok: true, user: { email: user.email } });
}
