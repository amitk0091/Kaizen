import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { verifyWebhookSignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature');
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }
  const event = JSON.parse(raw);
  const eventId = event?.id;
  await dbConnect();
  try {
    const sub = event?.payload?.subscription?.entity;
    const subId = sub?.id;
    if (subId) {
      const user = await User.findOne({ razorpaySubscriptionId: subId });
      if (user) {
        // Prevent duplicate event processing (idempotency)
        if (eventId && user.processedWebhookEventIds?.includes(eventId)) {
          return NextResponse.json({ ok: true });
        }
        switch (event.event) {
          case 'subscription.activated':
          case 'subscription.charged': {
            user.subscriptionStatus = 'active';
            const days = user.plan === 'yearly' ? 365 : 30;
            user.currentPeriodEnd = new Date(Date.now() + days * 864e5);
            break;
          }
          case 'subscription.pending':
          case 'subscription.halted':
            user.subscriptionStatus = 'past_due';
            break;
          case 'subscription.cancelled':
          case 'subscription.completed':
            user.subscriptionStatus = 'canceled';
            break;
        }
        // Track processed event
        if (eventId) {
          user.processedWebhookEventIds = user.processedWebhookEventIds || [];
          user.processedWebhookEventIds.push(eventId);
          // Keep only last 100 event IDs to avoid array bloat
          if (user.processedWebhookEventIds.length > 100) {
            user.processedWebhookEventIds = user.processedWebhookEventIds.slice(-100);
          }
        }
        await user.save();
      }
    }
  } catch (e) {
    console.error('webhook handling error', e.message);
  }
  return NextResponse.json({ ok: true });
}
