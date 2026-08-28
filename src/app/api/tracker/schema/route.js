import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import TrackerSchema from '@/models/TrackerSchema';

const DEFAULT_FIELDS = [
  { fieldId: 'f_focus', label: 'Focused deep-work (minutes)', type: 'number', order: 0, isActive: true, options: [] },
  { fieldId: 'f_mood', label: 'Overall day rating', type: 'scale', order: 1, isActive: true, options: [] },
  { fieldId: 'f_top', label: "Today's #1 priority done?", type: 'boolean', order: 2, isActive: true, options: [] },
  { fieldId: 'f_notes', label: 'One line about today', type: 'longtext', order: 3, isActive: true, options: [] },
];

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;
  await dbConnect();
  let doc = await TrackerSchema.findOne({ userId });
  if (!doc) doc = await TrackerSchema.create({ userId, version: 1, fields: DEFAULT_FIELDS });
  return NextResponse.json({ schema: doc });
}

// Replace the field list. Existing entries are untouched (soft-delete via isActive).
export async function PUT(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  const { fields } = await req.json();
  if (!Array.isArray(fields)) return NextResponse.json({ error: 'fields must be an array' }, { status: 400 });
  await dbConnect();
  let doc = await TrackerSchema.findOne({ userId });
  if (!doc) doc = new TrackerSchema({ userId, fields: [] });
  const prevIds = new Set(doc.fields.map((f) => f.fieldId));
  // Ensure each field has a stable id.
  const clean = fields.map((f, i) => ({
    fieldId: f.fieldId || `f_${Date.now()}_${i}`,
    label: (f.label || 'Untitled').slice(0, 120),
    type: f.type || 'text',
    options: Array.isArray(f.options) ? f.options.filter(Boolean).slice(0, 30) : [],
    required: !!f.required,
    helpText: (f.helpText || '').slice(0, 200),
    order: typeof f.order === 'number' ? f.order : i,
    isActive: f.isActive === false ? false : true,
  }));
  doc.fields = clean;
  doc.version = (doc.version || 1) + 1;
  await doc.save();
  return NextResponse.json({ schema: doc, note: 'Deleted fields are soft-removed; past entries keep their values.' });
}
