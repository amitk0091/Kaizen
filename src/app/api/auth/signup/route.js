import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS || '3', 10);
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_PASSWORD_LENGTH = 12;

function validateEmail(email) {
  const trimmed = (email || '').toLowerCase().trim();
  if (!trimmed) return { valid: false, error: 'Email is required' };
  if (trimmed.length > 254) return { valid: false, error: 'Email is too long' };
  if (!emailRegex.test(trimmed)) return { valid: false, error: 'Invalid email format' };
  return { valid: true, value: trimmed };
}

function validatePassword(password) {
  if (!password) return { valid: false, error: 'Password is required' };
  if (typeof password !== 'string') return { valid: false, error: 'Password must be a string' };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  return { valid: true };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    if (name && typeof name !== 'string') {
      return NextResponse.json({ error: 'Name must be a string' }, { status: 400 });
    }

    await dbConnect();
    const exists = await User.findOne({ email: emailValidation.value });
    if (exists) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    await User.create({
      email: emailValidation.value,
      passwordHash,
      name: (name || '').trim().slice(0, 100),
      trialStart: now,
      trialEnd
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Signup error:', e.message);
    return NextResponse.json({ error: 'Account creation failed' }, { status: 500 });
  }
}
