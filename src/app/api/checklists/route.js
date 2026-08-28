import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import Checklist from '@/models/Checklist';

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;
  await dbConnect();
  const lists = await Checklist.find({ userId }).sort({ createdAt: 1 }).lean();
  return NextResponse.json({ checklists: lists });
}

export async function POST(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const list = await Checklist.create({ userId, name: name.slice(0, 120), items: [] });
  return NextResponse.json({ checklist: list });
}
