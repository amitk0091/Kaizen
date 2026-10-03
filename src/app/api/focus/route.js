import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import { isDayString } from '@/lib/dates';
import FocusSession from '@/models/FocusSession';
import Todo from '@/models/Todo';

const MAX_MINUTES = 240;
const MAX_DISTRACTIONS = 50;

// GET /api/focus?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const q = { userId };
  if (isDayString(from) || isDayString(to)) {
    q.date = {};
    if (isDayString(from)) q.date.$gte = from;
    if (isDayString(to)) q.date.$lte = to;
  }
  await dbConnect();
  const sessions = await FocusSession.find(q).sort({ createdAt: -1 }).limit(500).lean();
  return NextResponse.json({ sessions });
}

// POST a finished session. The timer runs client-side; we store the result.
export async function POST(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  const b = await req.json().catch(() => ({}));
  if (!isDayString(b.date)) return NextResponse.json({ error: 'valid date required' }, { status: 400 });
  const plannedMin = Math.round(Number(b.plannedMin));
  const actualMin = Math.round(Number(b.actualMin));
  if (!(plannedMin > 0 && plannedMin <= MAX_MINUTES) || !(actualMin >= 0 && actualMin <= MAX_MINUTES)) {
    return NextResponse.json({ error: `minutes must be between 0 and ${MAX_MINUTES}` }, { status: 400 });
  }
  await dbConnect();

  // Derive the goal from the todo (and verify ownership) rather than trusting the client.
  let todoId = null, goalId = null;
  if (b.todoId && mongoose.isValidObjectId(b.todoId)) {
    const todo = await Todo.findOne({ _id: b.todoId, userId }).lean();
    if (todo) { todoId = todo._id; goalId = todo.goalId || null; }
  }

  const session = await FocusSession.create({
    userId,
    date: b.date,
    todoId,
    goalId,
    label: String(b.label || '').slice(0, 200),
    plannedMin,
    actualMin,
    completed: actualMin >= plannedMin,
    distractions: (Array.isArray(b.distractions) ? b.distractions : [])
      .map((d) => ({ text: String(d?.text || '').trim().slice(0, 300), at: d?.at ? new Date(d.at) : new Date() }))
      .filter((d) => d.text)
      .slice(0, MAX_DISTRACTIONS),
  });
  return NextResponse.json({ session }, { status: 201 });
}
