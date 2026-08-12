import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/mongo";
import { Subscription } from "@/lib/models";
import { getUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await req.json();

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (expected !== razorpay_signature)
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });

  const days = plan === "yearly" ? 365 : 30;
  const now = Date.now();
  await dbConnect();
  const sub = await Subscription.findOne({ userId: uid });
  // Extend from the later of now / current end (so paying early never loses days).
  const base = sub && new Date(sub.currentPeriodEnd).getTime() > now ? new Date(sub.currentPeriodEnd).getTime() : now;
  const currentPeriodEnd = new Date(base + days * 24 * 60 * 60 * 1000);
  await Subscription.findOneAndUpdate(
    { userId: uid },
    { $set: { plan, status: "active", currentPeriodEnd, razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true, currentPeriodEnd });
}
