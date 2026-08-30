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
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: 'Razorpay credentials not configured' }, { status: 500 });
  }
  await dbConnect();
  try {
    const rzp = razorpayClient();
    let user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let customerId = user?.razorpayCustomerId;

    if (!customerId) {
      console.log('Creating Razorpay customer for user:', userId);
      const customer = await rzp.customers.create({
        email: user.email,
        name: user.name || 'User',
        contact: user.phone || '',
        notes: { userId: userId.toString() },
      });
      customerId = customer.id;
      console.log('Created customer:', customerId);
      await User.findByIdAndUpdate(userId, { razorpayCustomerId: customerId });
    }

    console.log('Creating subscription for customer:', customerId, 'plan:', planId);
    const sub = await rzp.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      customer_notify: 1,
      total_count: plan === 'yearly' ? 5 : 60,
      notes: { userId, plan },
    });
    console.log('Subscription created:', sub.id);
    await User.findByIdAndUpdate(userId, { razorpaySubscriptionId: sub.id, plan });
    return NextResponse.json({ subscriptionId: sub.id, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID });
  } catch (e) {
    console.error('razorpay subscribe failed:', {
      message: e?.message,
      response: e?.response?.data,
      status: e?.response?.status,
      stack: e?.stack,
    });
    return NextResponse.json({ error: 'Could not start subscription', details: e?.message }, { status: 502 });
  }
}
