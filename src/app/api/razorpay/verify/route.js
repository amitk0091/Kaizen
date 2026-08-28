import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { verifyPaymentSignature } from '@/lib/razorpay';

export async function POST(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, plan } = await req.json();
  const ok = verifyPaymentSignature({
    subscriptionId: razorpay_subscription_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!ok) return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
  await dbConnect();
  const now = new Date();
  const end = new Date(now.getTime() + (plan === 'yearly' ? 365 : 30) * 864e5);
  await User.findByIdAndUpdate(userId, {
    subscriptionStatus: 'active', plan: plan || 'monthly',
    razorpaySubscriptionId: razorpay_subscription_id, currentPeriodEnd: end,
  });
  return NextResponse.json({ ok: true });
}
