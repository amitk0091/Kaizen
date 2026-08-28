import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';

// Central entitlement logic. A user can WRITE / generate AI when either:
//  - subscription is active, OR
//  - still within the trial window.
export function computeAccess(user) {
  const now = new Date();
  const trialActive = user.trialEnd && now <= new Date(user.trialEnd);
  const subActive = user.subscriptionStatus === 'active' && (!user.currentPeriodEnd || now <= new Date(user.currentPeriodEnd));
  const canWrite = Boolean(subActive || trialActive);
  return {
    canWrite,
    trialActive,
    subActive,
    trialEnd: user.trialEnd,
    subscriptionStatus: user.subscriptionStatus || 'none',
    currentPeriodEnd: user.currentPeriodEnd || null,
    plan: user.plan || null,
  };
}

// Use inside API route handlers that mutate data or generate AI.
// Returns { user, access } or { error } (a ready NextResponse 402/404).
export async function requireWriteAccess(userId) {
  await dbConnect();
  const user = await User.findById(userId);
  if (!user) return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
  const access = computeAccess(user);
  if (!access.canWrite) {
    return {
      error: NextResponse.json(
        { error: 'trial_expired', message: 'Your free trial has ended. Subscribe to keep using Kaizen.' },
        { status: 402 }
      ),
    };
  }
  return { user, access };
}
