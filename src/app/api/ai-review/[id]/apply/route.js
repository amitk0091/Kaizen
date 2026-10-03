import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import { extractTinySteps } from '@/lib/reviewSteps';
import AiReview from '@/models/AiReview';
import Checklist from '@/models/Checklist';

// POST: turn a review's "3 tiny steps" into a checklist (once per review).
export async function POST(req, { params }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  await dbConnect();
  const review = await AiReview.findOne({ _id: params.id, userId });
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (review.appliedChecklistId) return NextResponse.json({ checklistId: review.appliedChecklistId, alreadyApplied: true });

  const steps = extractTinySteps(review.output);
  if (!steps.length) return NextResponse.json({ error: 'no_steps', message: "Couldn't find the tiny steps in this review." }, { status: 422 });

  const label = new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const checklist = await Checklist.create({
    userId,
    name: `Tiny steps · ${label}`,
    items: steps.map((text, i) => ({ itemId: `i_${Date.now()}_${i}`, text, done: false, order: i })),
  });
  review.appliedChecklistId = checklist._id;
  await review.save();
  return NextResponse.json({ checklistId: checklist._id });
}
