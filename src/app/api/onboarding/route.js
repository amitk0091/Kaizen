import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import User from '@/models/User';

export async function POST(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  const { identityStatement, answers } = await req.json();
  await User.findByIdAndUpdate(userId, {
    identityStatement: identityStatement || '',
    onboardingAnswers: answers || {},
    onboardingComplete: true,
  });
  return NextResponse.json({ ok: true });
}
