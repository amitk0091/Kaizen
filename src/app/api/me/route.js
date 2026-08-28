import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { computeAccess } from '@/lib/entitlement';

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;
  await dbConnect();
  const user = await User.findById(userId).lean();
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const access = computeAccess(user);
  return NextResponse.json({
    user: {
      id: user._id.toString(), email: user.email, name: user.name,
      identityStatement: user.identityStatement, onboardingComplete: user.onboardingComplete,
    },
    access,
    pricing: { monthly: process.env.PRICE_MONTHLY || '49', yearly: process.env.PRICE_YEARLY || '499' },
  });
}
