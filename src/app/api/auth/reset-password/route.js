import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { sendNewPasswordEmail, randomPassword } from '@/lib/mailer';
import { passwordResetLimiter } from '@/lib/rateLimiter';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(req) {
  try {
    const body = await req.json();
    const email = (body?.email || '').toLowerCase().trim();

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    try {
      passwordResetLimiter(clientIp);
    } catch (e) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please try again later.' },
        { status: e.status || 429, headers: { 'Retry-After': String(e.retryAfter || 60) } }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email });

    if (user) {
      try {
        const newPass = randomPassword(16);
        user.passwordHash = await bcrypt.hash(newPass, 12);
        await user.save();
        await sendNewPasswordEmail(email, newPass);
      } catch (e) {
        console.error('Password reset failed:', e.message);
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'If that email exists, a new password has been sent.'
    });
  } catch (e) {
    console.error('Password reset error:', e.message);
    return NextResponse.json({ error: 'Request processing failed' }, { status: 500 });
  }
}
