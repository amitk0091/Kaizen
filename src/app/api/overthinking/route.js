import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import Overthinking from '@/models/Overthinking';

export async function GET(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from'); const to = searchParams.get('to');
  const q = { userId };
  if (from || to) { q.date = {}; if (from) q.date.$gte = from; if (to) q.date.$lte = to; }
  const items = await Overthinking.find(q).sort({ date: -1, createdAt: -1 }).limit(500).lean();
  return NextResponse.json({ items });
}

export async function POST(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  const b = await req.json();
  if (!b.date) return NextResponse.json({ error: 'date required' }, { status: 400 });
  const item = await Overthinking.create({ userId, date: b.date, thought: (b.thought || '').slice(0,1000), trigger: (b.trigger || '').slice(0,200), inControl: !!b.inControl, note: (b.note || '').slice(0,1000) });
  return NextResponse.json({ item });
}
