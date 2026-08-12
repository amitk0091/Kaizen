import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import { UserState, User } from "@/lib/models";
import { getUserId } from "@/lib/auth";
import { defaultState } from "@/lib/types";

export async function GET(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await dbConnect();
  let doc = await UserState.findOne({ userId: uid });
  if (!doc) {
    const u = await User.findById(uid);
    doc = await UserState.create({ userId: uid, data: { ...defaultState(), trialStart: (u?.trialStart ?? new Date()).toISOString().slice(0, 10) } });
  }
  return NextResponse.json({ state: doc.data, rev: doc.rev, updatedAt: doc.updatedAt });
}

export async function PUT(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { state } = await req.json();
  if (!state || typeof state !== "object") return NextResponse.json({ error: "bad state" }, { status: 400 });
  await dbConnect();

  // Last-write-wins by client updatedAt. Small data => whole-blob upsert is fine.
  const existing = await UserState.findOne({ userId: uid });
  if (existing && (existing.data?.updatedAt || 0) > (state.updatedAt || 0)) {
    // Server is newer (e.g. another device) — return server copy to reconcile.
    return NextResponse.json({ conflict: true, state: existing.data, rev: existing.rev });
  }
  const doc = await UserState.findOneAndUpdate(
    { userId: uid },
    { $set: { data: state }, $inc: { rev: 1 } },
    { new: true, upsert: true }
  );
  // Persist persona to the user doc too, for convenience.
  if (state.persona) await User.findByIdAndUpdate(uid, { persona: state.persona });
  return NextResponse.json({ ok: true, rev: doc.rev });
}
