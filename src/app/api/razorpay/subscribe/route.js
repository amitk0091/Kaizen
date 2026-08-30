import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { razorpayClient } from '@/lib/razorpay';

export async function POST(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const { plan } = await req.json(); // 'monthly' | 'yearly'
  const planId = plan === 'yearly' ? process.env.RAZORPAY_PLAN_YEARLY : process.env.RAZORPAY_PLAN_MONTHLY;
  if (!planId) return NextResponse.json({ error: 'Plan not configured' }, { status: 500 });
  await dbConnect();
  try {
    const rzp = razorpayClient();
    let user = await User.findById(userId);
    let customerId = user?.razorpayCustomerId;

    if (!customerId) {
      const customer = await rzp.customers.create({
        email: user.email,
        name: user.name || 'User',
        contact: user.phone || '',
        notes: { userId: userId.toString() },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(userId, { razorpayCustomerId: customerId });
    }

    const sub = await rzp.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      customer_notify: 1,
      total_count: plan === 'yearly' ? 5 : 60,
      notes: { userId, plan },
    });
    await User.findByIdAndUpdate(userId, { razorpaySubscriptionId: sub.id, plan });
    return NextResponse.json({ subscriptionId: sub.id, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID });
  } catch (e) {
    console.error('razorpay subscribe failed', e?.message || e);
    return NextResponse.json({ error: 'Could not start subscription' }, { status: 502 });
  }
}
