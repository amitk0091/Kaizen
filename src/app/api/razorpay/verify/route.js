import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { verifyPaymentSignature } from '@/lib/razorpay';

const VALID_PLANS = ['monthly', 'yearly'];
const SUBSCRIPTION_DURATION = {
  monthly: 30,
  yearly: 365,
};

export async function POST(req) {
  try {
    const { userId, error } = await requireUserId();
    if (error) return error;

    const body = await req.json();
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, plan } = body;

    if (!razorpay_payment_id?.trim()) {
      return NextResponse.json({ error: 'payment_id required' }, { status: 400 });
    }
    if (!razorpay_subscription_id?.trim()) {
      return NextResponse.json({ error: 'subscription_id required' }, { status: 400 });
    }
    if (!razorpay_signature?.trim()) {
      return NextResponse.json({ error: 'signature required' }, { status: 400 });
    }
    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json({ error: 'invalid plan' }, { status: 400 });
    }

    const ok = verifyPaymentSignature({
      subscriptionId: razorpay_subscription_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!ok) return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });

    await dbConnect();
    const now = new Date();
    const durationDays = SUBSCRIPTION_DURATION[plan];
    const end = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: 'active',
      plan,
      razorpaySubscriptionId: razorpay_subscription_id,
      currentPeriodEnd: end,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Payment verification error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
