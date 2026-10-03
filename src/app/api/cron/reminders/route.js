import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { computeAccess } from '@/lib/entitlement';
import { localNowIn } from '@/lib/dates';
import { pushConfigured, sendToSubscriptions } from '@/lib/push';
import User from '@/models/User';
import DailyPlan from '@/models/DailyPlan';

export const dynamic = 'force-dynamic';

// A reminder fires on the first cron run within this many minutes after its time.
// Must be >= the cron interval (vercel.json runs every 15 minutes).
const SEND_WINDOW_MIN = 60;

const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

// GET /api/cron/reminders — called by Vercel Cron with `Authorization: Bearer $CRON_SECRET`.
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!pushConfigured()) return NextResponse.json({ error: 'VAPID keys missing' }, { status: 500 });
  await dbConnect();

  const users = User.find(
    { 'reminders.enabled': true, 'pushSubscriptions.0': { $exists: true } },
    { reminders: 1, pushSubscriptions: 1, identityStatement: 1, trialEnd: 1, subscriptionStatus: 1, currentPeriodEnd: 1 }
  ).cursor();

  let sent = 0;
  for await (const user of users) {
    if (!computeAccess(user).canWrite) continue; // locked accounts can't act on a nudge
    const r = user.reminders;
    let now;
    try { now = localNowIn(r.timeZone || 'Asia/Kolkata'); } catch { continue; }

    for (const slot of ['morning', 'evening']) {
      const at = r[slot];
      const lastKey = slot === 'morning' ? 'lastMorning' : 'lastEvening';
      if (!at || r[lastKey] === now.day) continue;
      const start = toMinutes(at);
      if (now.minutes < start || now.minutes >= start + SEND_WINDOW_MIN) continue;

      // Skip if the user already did the thing we'd nudge them about.
      const plan = await DailyPlan.findOne({ userId: user._id, date: now.day }, { oneThing: 1, shutdownDone: 1 }).lean();
      const alreadyDone = slot === 'morning' ? Boolean(plan?.oneThing) : Boolean(plan?.shutdownDone);

      if (!alreadyDone) {
        const identity = user.identityStatement ? ` — a vote for becoming ${user.identityStatement}` : '';
        const payload = slot === 'morning'
          ? { title: 'Pick your One Thing ☀️', body: `What single task would make today a win${identity}?`, url: '/dashboard' }
          : { title: '2-minute shutdown 🌙', body: 'Write 3 wins and choose tomorrow\'s One Thing. Close the day on purpose.', url: '/dashboard#shutdown' };
        const dead = await sendToSubscriptions(user.pushSubscriptions, payload);
        if (dead.length) user.pushSubscriptions = user.pushSubscriptions.filter((s) => !dead.includes(s.endpoint));
        sent++;
      }
      user.reminders[lastKey] = now.day;
      await user.save();
    }
  }
  return NextResponse.json({ ok: true, sent });
}
