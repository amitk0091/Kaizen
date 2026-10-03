import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import Overthinking from '@/models/Overthinking';
import Todo from '@/models/Todo';

export async function PUT(req, { params }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  await dbConnect();
  const doc = await Overthinking.findOne({ _id: params.id, userId });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const b = await req.json();
  if ('date' in b) doc.date = b.date;
  if (typeof b.thought === 'string') doc.thought = b.thought.slice(0,1000);
  if (typeof b.trigger === 'string') doc.trigger = b.trigger.slice(0,200);
  if (typeof b.inControl === 'boolean') doc.inControl = b.inControl;
  if (typeof b.note === 'string') doc.note = b.note.slice(0,1000);
  if (typeof b.evidence === 'string') doc.evidence = b.evidence.slice(0,1000);
  if (typeof b.friendAdvice === 'string') doc.friendAdvice = b.friendAdvice.slice(0,1000);
  if (typeof b.nextAction === 'string') doc.nextAction = b.nextAction.slice(0,200);
  if (['open', 'actioned', 'released'].includes(b.status)) doc.status = b.status;
  // "Make it a todo": turn the smallest next action into a real task, once.
  if (b.makeTodo && !doc.todoId) {
    const title = (doc.nextAction || '').trim();
    if (!title) return NextResponse.json({ error: 'Add a next action first' }, { status: 400 });
    const todo = await Todo.create({ userId, title, notes: `From overthinking: ${doc.thought}`.slice(0, 1000), priority: 'medium' });
    doc.todoId = todo._id;
    doc.status = 'actioned';
  }
  await doc.save();
  return NextResponse.json({ item: doc });
}

export async function DELETE(req, { params }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  await dbConnect();
  const r = await Overthinking.deleteOne({ _id: params.id, userId });
  if (r.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
