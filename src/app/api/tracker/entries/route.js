import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import TrackerEntry from '@/models/TrackerEntry';

// GET /api/tracker/entries?from=YYYY-MM-DD&to=YYYY-MM-DD&date=YYYY-MM-DD
export async function GET(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  if (date) {
    const entry = await TrackerEntry.findOne({ userId, date }).lean();
    return NextResponse.json({ entry: entry || null });
  }
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const q = { userId };
  if (from || to) { q.date = {}; if (from) q.date.$gte = from; if (to) q.date.$lte = to; }
  const entries = await TrackerEntry.find(q).sort({ date: -1 }).limit(500).lean();
  return NextResponse.json({ entries });
}

// POST upsert today's (or a given date's) entry.
export async function POST(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  const { date, values, schemaVersion } = await req.json();
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });
  await dbConnect();
  const entry = await TrackerEntry.findOneAndUpdate(
    { userId, date },
    { $set: { values: values || {}, schemaVersion: schemaVersion || 1 } },
    { upsert: true, new: true }
  );
  return NextResponse.json({ entry });
}
