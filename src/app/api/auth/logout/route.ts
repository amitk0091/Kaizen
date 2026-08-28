import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

// Node.js runtime required (mongoose / bcrypt / node:crypto / razorpay are not Edge-compatible).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST() { clearSession(); return NextResponse.json({ ok: true }); }
