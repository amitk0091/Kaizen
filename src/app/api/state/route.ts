import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import { UserState, User } from "@/lib/models";
import { getUserId } from "@/lib/auth";
import { defaultState } from "@/lib/types";
import { encryptJSON, decryptJSON } from "@/lib/crypto";
import { isEntitledUser, paywallResponse, sameOrigin } from "@/lib/guard";

// Node.js runtime required (mongoose / bcrypt / node:crypto / razorpay are not Edge-compatible).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 1_000_000; // 1 MB cap on a user's state blob (abuse/DoS guard)

// Reading is always allowed (even after trial) so users can view & export their
// own data. Writing is gated by entitlement.
export async function GET(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await dbConnect();
  let doc = await UserState.findOne({ userId: uid });
  if (!doc) {
    const u = await User.findById(uid);
    const seed = { ...defaultState(), trialStart: (u?.trialStart ?? new Date()).toISOString().slice(0, 10) };
    doc = await UserState.create({ userId: uid, data: encryptJSON(seed) });
  }
  return NextResponse.json({ state: decryptJSON(doc.data), rev: doc.rev, updatedAt: doc.updatedAt });
}

export async function PUT(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "bad origin" }, { status: 403 });

  await dbConnect();
  // Enforce access server-side: no valid trial/subscription => no writes.
  if (!(await isEntitledUser(uid))) return paywallResponse();

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "State too large." }, { status: 413 });
  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  const state = body?.state;
  if (!state || typeof state !== "object" || Array.isArray(state))
    return NextResponse.json({ error: "bad state" }, { status: 400 });

  // Last-write-wins by client updatedAt. Decrypt the stored blob to compare.
  const existing = await UserState.findOne({ userId: uid });
  if (existing) {
    const cur = decryptJSON(existing.data);
    if ((cur?.updatedAt || 0) > (state.updatedAt || 0)) {
      return NextResponse.json({ conflict: true, state: cur, rev: existing.rev });
    }
  }
  const doc = await UserState.findOneAndUpdate(
    { userId: uid },
    { $set: { data: encryptJSON(state) }, $inc: { rev: 1 } },
    { new: true, upsert: true }
  );
  if (typeof state.persona === "string") await User.findByIdAndUpdate(uid, { persona: state.persona });
  return NextResponse.json({ ok: true, rev: doc.rev });
}
