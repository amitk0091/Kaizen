import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/mongo";
import { Subscription } from "@/lib/models";
import { safeEqual } from "@/lib/crypto";

// Node.js runtime required (mongoose / bcrypt / node:crypto / razorpay are not Edge-compatible).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Razorpay sends the raw body; verify the signature (constant-time) before trusting it.
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 500 });

  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (!safeEqual(expected, signature)) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  const event = JSON.parse(body);
  await dbConnect();

  if (event.event === "payment.captured") {
    const entity = event.payload?.payment?.entity || {};
    const notes = entity.notes || {};
    const paymentId = entity.id;
    if (notes.userId && paymentId) {
      // Idempotency: ignore if we've already processed this payment.
      const already = await Subscription.findOne({ userId: notes.userId, razorpayPaymentId: paymentId });
      if (already) return NextResponse.json({ received: true, duplicate: true });

      const plan = notes.plan === "yearly" ? "yearly" : "monthly";
      const days = plan === "yearly" ? 365 : 30;
      const sub = await Subscription.findOne({ userId: notes.userId });
      const now = Date.now();
      const base = sub && new Date(sub.currentPeriodEnd).getTime() > now ? new Date(sub.currentPeriodEnd).getTime() : now;
      const end = new Date(base + days * 24 * 60 * 60 * 1000);
      await Subscription.findOneAndUpdate(
        { userId: notes.userId },
        { $set: { plan, status: "active", currentPeriodEnd: end, razorpayPaymentId: paymentId } },
        { upsert: true }
      );
    }
  }
  return NextResponse.json({ received: true });
}
