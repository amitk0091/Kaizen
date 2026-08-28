import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getUserId } from "@/lib/auth";
import { sameOrigin, rateLimit } from "@/lib/guard";

// Node.js runtime required (mongoose / bcrypt / node:crypto / razorpay are not Edge-compatible).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "bad origin" }, { status: 403 });
  if (!rateLimit(`order:${uid}`, 10, 60_000))
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });

  const { plan: rawPlan } = await req.json();
  const plan = rawPlan === "yearly" ? "yearly" : "monthly"; // never trust arbitrary values
  const amount = plan === "yearly"
    ? parseInt(process.env.PRICE_YEARLY_PAISE || "49900", 10)
    : parseInt(process.env.PRICE_MONTHLY_PAISE || "4900", 10);

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
    return NextResponse.json({ error: "Payments are not configured yet (set RAZORPAY_* env vars)." }, { status: 500 });

  const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  const order = await rzp.orders.create({
    amount,
    currency: "INR",
    receipt: `kaizen_${uid}_${Date.now()}`,
    notes: { userId: uid, plan }, // authoritative — read back server-side on verify
  });
  return NextResponse.json({ orderId: order.id, amount, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID, plan });
}
