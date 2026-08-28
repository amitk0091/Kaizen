import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import Goal from '@/models/Goal';

export async function PUT(req, { params }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  await dbConnect();
  const goal = await Goal.findOne({ _id: params.id, userId });
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const b = await req.json();
  if (typeof b.title === 'string') goal.title = b.title.slice(0, 200);
  if (typeof b.identity === 'string') goal.identity = b.identity.slice(0, 200);
  if ('targetDate' in b) goal.targetDate = b.targetDate ? new Date(b.targetDate) : null;
  if (typeof b.ifThenPlan === 'string') goal.ifThenPlan = b.ifThenPlan.slice(0, 400);
  if (typeof b.shieldingPlan === 'string') goal.shieldingPlan = b.shieldingPlan.slice(0, 400);
  if (Array.isArray(b.subGoals)) {
    goal.subGoals = b.subGoals.map((s, i) => ({ subId: s.subId || `s_${Date.now()}_${i}`, title: (s.title || '').slice(0, 200), done: !!s.done }));
  }
  if (typeof b.completed === 'boolean') goal.completed = b.completed;
  await goal.save();
  return NextResponse.json({ goal });
}

export async function DELETE(req, { params }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  await dbConnect();
  const r = await Goal.deleteOne({ _id: params.id, userId });
  if (r.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
