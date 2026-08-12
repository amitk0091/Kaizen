import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import { User } from "@/lib/models";
import { verifyPassword, setSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  await dbConnect();
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  await setSession(user._id.toString()); // keeps user logged in for 30 days
  return NextResponse.json({ ok: true, user: { email: user.email } });
}
