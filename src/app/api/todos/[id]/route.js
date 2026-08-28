import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import Todo from '@/models/Todo';

export async function PUT(req, { params }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  await dbConnect();
  const todo = await Todo.findOne({ _id: params.id, userId });
  if (!todo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const b = await req.json();
  if (typeof b.title === 'string') todo.title = b.title.slice(0, 200);
  if (typeof b.notes === 'string') todo.notes = b.notes.slice(0, 1000);
  if (['pending', 'ongoing', 'completed'].includes(b.status)) todo.status = b.status;
  if (['low', 'medium', 'high'].includes(b.priority)) todo.priority = b.priority;
  if ('deadline' in b) todo.deadline = b.deadline ? new Date(b.deadline) : null;
  await todo.save();
  return NextResponse.json({ todo });
}

export async function DELETE(req, { params }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  await dbConnect();
  const r = await Todo.deleteOne({ _id: params.id, userId });
  if (r.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
