import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import { User } from "@/lib/models";
import { getUserId, setSession } from "@/lib/auth";
import { getOrCreateSubscription, isEntitled, trialEnd } from "@/lib/subscription";

// Node.js runtime required (mongoose / bcrypt / node:crypto / razorpay are not Edge-compatible).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ user: null }, { status: 200 });
  await dbConnect();
  const user = await User.findById(uid);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  const sub = await getOrCreateSubscription(uid, user.trialStart);
  // Sliding session: every check-in extends the 30-day window so active users
  // never get logged out.
  await setSession(uid);

  return NextResponse.json({
    user: { email: user.email, persona: user.persona, trialStart: user.trialStart },
    subscription: {
      plan: sub.plan,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      entitled: isEntitled(sub),
      trialEnd: trialEnd(user.trialStart),
    },
  });
}
