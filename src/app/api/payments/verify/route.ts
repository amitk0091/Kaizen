import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { dbConnect } from "@/lib/mongo";
import { Subscription } from "@/lib/models";
import { getUserId } from "@/lib/auth";
import { safeEqual } from "@/lib/crypto";
import { sameOrigin } from "@/lib/guard";

// Node.js runtime required (mongoose / bcrypt / node:crypto / razorpay are not Edge-compatible).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "bad origin" }, { status: 403 });
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
    return NextResponse.json({ error: "Payments are not configured." }, { status: 500 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return NextResponse.json({ error: "Missing payment fields." }, { status: 400 });

  // 1) Verify the signature (constant-time) — proves the payment matches the order.
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (!safeEqual(expected, razorpay_signature))
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });

  // 2) Fetch the order from Razorpay so the PLAN and AMOUNT are authoritative
  //    (never trust the client — this blocks the "pay ₹49, claim yearly" exploit).
  const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  const order: any = await rzp.orders.fetch(razorpay_order_id);

  // 3) Confirm the order actually belongs to this logged-in user.
  if (order?.notes?.userId && order.notes.userId !== uid)
    return NextResponse.json({ error: "Order does not belong to this account." }, { status: 403 });
  if (order?.status !== "paid")
    return NextResponse.json({ error: "Order is not paid." }, { status: 400 });

  const plan = order?.notes?.plan === "yearly" ? "yearly" : "monthly";
  // Cross-check the paid amount against the expected server-side price.
  const expectedAmount = plan === "yearly"
    ? parseInt(process.env.PRICE_YEARLY_PAISE || "49900", 10)
    : parseInt(process.env.PRICE_MONTHLY_PAISE || "4900", 10);
  if (Number(order?.amount_paid ?? order?.amount) !== expectedAmount)
    return NextResponse.json({ error: "Amount mismatch." }, { status: 400 });

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
  return NextResponse.json({ ok: true, plan, currentPeriodEnd });
}
