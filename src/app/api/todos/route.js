import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import Todo from '@/models/Todo';

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;
  await dbConnect();
  const todos = await Todo.find({ userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ todos });
}

export async function POST(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  const b = await req.json();
  if (!b.title) return NextResponse.json({ error: 'title required' }, { status: 400 });
  const todo = await Todo.create({
    userId, title: b.title.slice(0, 200), notes: (b.notes || '').slice(0, 1000),
    status: ['pending', 'ongoing', 'completed'].includes(b.status) ? b.status : 'pending',
    priority: ['low', 'medium', 'high'].includes(b.priority) ? b.priority : 'medium',
    deadline: b.deadline ? new Date(b.deadline) : null,
    goalId: b.goalId || null,
  });
  return NextResponse.json({ todo });
}
