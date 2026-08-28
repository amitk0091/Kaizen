import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import Goal from '@/models/Goal';

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;
  await dbConnect();
  const goals = await Goal.find({ userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ goals });
}

export async function POST(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  const b = await req.json();
  if (!b.title) return NextResponse.json({ error: 'title required' }, { status: 400 });
  const goal = await Goal.create({
    userId, title: b.title.slice(0, 200), identity: (b.identity || '').slice(0, 200),
    targetDate: b.targetDate ? new Date(b.targetDate) : null,
    ifThenPlan: (b.ifThenPlan || '').slice(0, 400), shieldingPlan: (b.shieldingPlan || '').slice(0, 400),
    subGoals: Array.isArray(b.subGoals) ? b.subGoals.map((s, i) => ({ subId: s.subId || `s_${Date.now()}_${i}`, title: (s.title || '').slice(0, 200), done: !!s.done })) : [],
  });
  return NextResponse.json({ goal });
}
