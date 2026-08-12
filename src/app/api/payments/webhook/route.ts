import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/mongo";
import { Subscription } from "@/lib/models";

// Razorpay sends the raw body; verify the signature before trusting it.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET as string).update(body).digest("hex");
  if (expected !== signature) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  const event = JSON.parse(body);
  await dbConnect();
  // Handle the common events; extend as you add recurring subscriptions.
  if (event.event === "payment.captured") {
    const notes = event.payload?.payment?.entity?.notes || {};
    if (notes.userId) {
      const days = notes.plan === "yearly" ? 365 : 30;
      const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      await Subscription.findOneAndUpdate(
        { userId: notes.userId },
        { $set: { plan: notes.plan || "monthly", status: "active", currentPeriodEnd: end } },
        { upsert: true }
      );
    }
  }
  return NextResponse.json({ received: true });
}
