import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function validTimeZone(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
}

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;
  await dbConnect();
  const user = await User.findById(userId, { reminders: 1, pushSubscriptions: 1 }).lean();
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const r = user.reminders || {};
  return NextResponse.json({
    reminders: { enabled: !!r.enabled, morning: r.morning ?? '08:00', evening: r.evening ?? '21:00', timeZone: r.timeZone || 'Asia/Kolkata' },
    devices: (user.pushSubscriptions || []).length,
    pushAvailable: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
  });
}

// PUT { reminders: { enabled, morning, evening, timeZone } }
export async function PUT(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const { reminders = {} } = await req.json().catch(() => ({}));
  const $set = {};
  if (typeof reminders.enabled === 'boolean') $set['reminders.enabled'] = reminders.enabled;
  for (const k of ['morning', 'evening']) {
    if (reminders[k] === '' || TIME_RE.test(reminders[k] || '')) $set[`reminders.${k}`] = reminders[k];
  }
  if (typeof reminders.timeZone === 'string' && validTimeZone(reminders.timeZone)) $set['reminders.timeZone'] = reminders.timeZone;
  await dbConnect();
  await User.updateOne({ _id: userId }, { $set });
  return NextResponse.json({ ok: true });
}
