import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { sendNewPasswordEmail, randomPassword } from '@/lib/mailer';

export async function POST(req) {
  try {
    const { email } = await req.json();
    const em = (email || '').toLowerCase().trim();
    await dbConnect();
    const user = await User.findOne({ email: em });
    // Always return ok to avoid leaking which emails exist.
    if (user) {
      const newPass = randomPassword(10);
      user.passwordHash = await bcrypt.hash(newPass, 10);
      await user.save();
      try { await sendNewPasswordEmail(em, newPass); } catch (e) { console.error('mail failed', e.message); }
    }
    return NextResponse.json({ ok: true, message: 'If that email exists, a new password has been sent.' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
