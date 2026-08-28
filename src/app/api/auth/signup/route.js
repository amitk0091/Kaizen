import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS || '3', 10);
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  try {
    const { email, password, name } = await req.json();
    const em = (email || '').toLowerCase().trim();
    if (!emailRe.test(em)) return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 });
    if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

    await dbConnect();
    const exists = await User.findOne({ email: em });
    if (exists) return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    await User.create({ email: em, passwordHash, name: name || '', trialStart: now, trialEnd });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
