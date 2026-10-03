import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

const MAX_DEVICES = 5;

function validSubscription(s) {
  return s && typeof s.endpoint === 'string' && s.endpoint.startsWith('https://')
    && typeof s.keys?.p256dh === 'string' && typeof s.keys?.auth === 'string';
}

// POST: register this device's push subscription.
export async function POST(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const { subscription } = await req.json().catch(() => ({}));
  if (!validSubscription(subscription)) return NextResponse.json({ error: 'invalid subscription' }, { status: 400 });
  await dbConnect();
  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const sub = { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } };
  user.pushSubscriptions = [...user.pushSubscriptions.filter((s) => s.endpoint !== sub.endpoint), sub].slice(-MAX_DEVICES);
  await user.save();
  return NextResponse.json({ ok: true });
}

// DELETE: remove this device's subscription.
export async function DELETE(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const { endpoint } = await req.json().catch(() => ({}));
  await dbConnect();
  await User.updateOne({ _id: userId }, { $pull: { pushSubscriptions: { endpoint } } });
  return NextResponse.json({ ok: true });
}
