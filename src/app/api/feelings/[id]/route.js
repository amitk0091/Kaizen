import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import Feeling from '@/models/Feeling';

export async function PUT(req, { params }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  await dbConnect();
  const doc = await Feeling.findOne({ _id: params.id, userId });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const b = await req.json();
  if ('date' in b) doc.date = b.date;
  if (typeof b.emotion === 'string') doc.emotion = b.emotion.slice(0,60);
  if (typeof b.intensity === 'number') doc.intensity = Math.min(5, Math.max(1, b.intensity));
  if (typeof b.note === 'string') doc.note = b.note.slice(0,1000);
  await doc.save();
  return NextResponse.json({ item: doc });
}

export async function DELETE(req, { params }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  await dbConnect();
  const r = await Feeling.deleteOne({ _id: params.id, userId });
  if (r.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
