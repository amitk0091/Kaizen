import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { dbConnect } from '@/lib/db';
import { pushConfigured, sendToSubscriptions } from '@/lib/push';
import User from '@/models/User';

// POST: send a test notification to all of this user's devices.
export async function POST() {
  const { userId, error } = await requireUserId();
  if (error) return error;
  if (!pushConfigured()) return NextResponse.json({ error: 'push_unavailable', message: 'Push is not configured on the server.' }, { status: 503 });
  await dbConnect();
  const user = await User.findById(userId);
  if (!user?.pushSubscriptions?.length) return NextResponse.json({ error: 'no_devices', message: 'No devices registered.' }, { status: 400 });
  const dead = await sendToSubscriptions(user.pushSubscriptions, { title: 'Kaizen reminders are on ✅', body: "This is how your morning and evening nudges will look.", url: '/dashboard' });
  if (dead.length) {
    user.pushSubscriptions = user.pushSubscriptions.filter((s) => !dead.includes(s.endpoint));
    await user.save();
  }
  return NextResponse.json({ ok: true });
}
