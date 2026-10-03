import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import { isDayString } from '@/lib/dates';
import DailyPlan from '@/models/DailyPlan';
import Todo from '@/models/Todo';

const MAX_TOP = 3;
const MAX_WINS = 3;

// GET /api/plan?date=YYYY-MM-DD
export async function GET(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const date = new URL(req.url).searchParams.get('date');
  if (!isDayString(date)) return NextResponse.json({ error: 'valid date required' }, { status: 400 });
  await dbConnect();
  const plan = await DailyPlan.findOne({ userId, date }).lean();
  return NextResponse.json({ plan: plan || null });
}

// PUT partial upsert: only fields present in the body are changed.
export async function PUT(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  const b = await req.json().catch(() => ({}));
  if (!isDayString(b.date)) return NextResponse.json({ error: 'valid date required' }, { status: 400 });
  await dbConnect();

  const $set = {};
  if (Array.isArray(b.top) || 'oneThing' in b) {
    // Only accept todos that belong to this user.
    const wanted = [...new Set([...(b.top || []), b.oneThing].filter((id) => id && mongoose.isValidObjectId(id)).map(String))];
    const owned = new Set((await Todo.find({ userId, _id: { $in: wanted } }, { _id: 1 }).lean()).map((t) => String(t._id)));
    if (Array.isArray(b.top)) $set.top = b.top.map(String).filter((id) => owned.has(id)).slice(0, MAX_TOP);
    if ('oneThing' in b) $set.oneThing = b.oneThing && owned.has(String(b.oneThing)) ? b.oneThing : null;
  }
  if (Array.isArray(b.wins)) $set.wins = b.wins.map((w) => String(w || '').trim().slice(0, 200)).filter(Boolean).slice(0, MAX_WINS);
  if (typeof b.slipped === 'string') $set.slipped = b.slipped.slice(0, 500);
  if (typeof b.shutdownDone === 'boolean') $set.shutdownDone = b.shutdownDone;

  const plan = await DailyPlan.findOneAndUpdate({ userId, date: b.date }, { $set }, { upsert: true, new: true });
  return NextResponse.json({ plan });
}
