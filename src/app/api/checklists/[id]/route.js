import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import Checklist from '@/models/Checklist';

async function owned(userId, id) {
  await dbConnect();
  const doc = await Checklist.findOne({ _id: id, userId });
  return doc;
}

export async function PUT(req, { params }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  const doc = await owned(userId, params.id);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json();
  if (typeof body.name === 'string') doc.name = body.name.slice(0, 120);
  if (Array.isArray(body.items)) {
    doc.items = body.items.map((it, i) => ({
      itemId: it.itemId || `i_${Date.now()}_${i}`,
      text: (it.text || '').slice(0, 200),
      done: !!it.done,
      order: typeof it.order === 'number' ? it.order : i,
    }));
  }
  await doc.save();
  return NextResponse.json({ checklist: doc });
}

export async function DELETE(req, { params }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  const doc = await owned(userId, params.id);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await doc.deleteOne();
  return NextResponse.json({ ok: true });
}
