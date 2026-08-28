import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { dbConnect } from "@/lib/mongo";
import { User, UserState } from "@/lib/models";
import { getUserId } from "@/lib/auth";
import { buildPrompt, heuristicReview, renderReview } from "@/lib/review";
import { isEntitledUser, paywallResponse, sameOrigin } from "@/lib/guard";
import { decryptJSON } from "@/lib/crypto";

// Node.js runtime required (mongoose / bcrypt / node:crypto / razorpay are not Edge-compatible).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameDay(a?: Date | null) {
  if (!a) return false;
  const d = new Date(a);
  const n = new Date();
  return d.toDateString() === n.toDateString();
}

async function callModel(prompt: string): Promise<string | null> {
  // Primary: Google Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
      const r = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6 },
      });
      const text = r.response.text();
      return text || null;
    } catch (e) { console.error("Gemini failed, trying Grok", e); }
  }
  // Fallback: xAI Grok (OpenAI-compatible)
  if (process.env.XAI_API_KEY) {
    try {
      const grok = new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: process.env.XAI_BASE_URL || "https://api.x.ai/v1" });
      const r = await grok.chat.completions.create({
        model: process.env.XAI_MODEL || "grok-2-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
      });
      return r.choices[0]?.message?.content || null;
    } catch (e) { console.error("Grok failed", e); }
  }
  return null;
}

/** Turn plain model text into the 3-block HTML the UI expects. */
function textToHtml(text: string): string {
  const sections: Record<string, string[]> = { good: [], watch: [], step: [] };
  let cur: keyof typeof sections | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const low = line.toLowerCase();
    if (low.includes("going right") || low.startsWith("1")) { cur = "good"; continue; }
    if (low.includes("watch") || low.startsWith("2")) { cur = "watch"; continue; }
    if (low.includes("improve") || low.startsWith("3")) { cur = "step"; continue; }
    const clean = line.replace(/^[-*•\d.\)\s]+/, "");
    if (cur && clean) sections[cur].push(clean);
  }
  if (!sections.good.length && !sections.watch.length && !sections.step.length)
    return `<div class="ai-review"><div class="ai-block ai-good"><p>${text}</p></div></div>`;
  return renderReview(sections.good, sections.watch, sections.step, false);
}

export async function POST(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "bad origin" }, { status: 403 });
  await dbConnect();
  // AI review is a paid feature — gate it server-side.
  if (!(await isEntitledUser(uid))) return paywallResponse();
  const user = await User.findById(uid);
  if (sameDay(user?.lastReviewAt))
    return NextResponse.json({ error: "You've already generated your AI review today. Come back tomorrow — one per day keeps reflection focused." }, { status: 429 });

  const stateDoc = await UserState.findOne({ userId: uid });
  // Stored blob is encrypted at rest — decrypt before building the prompt.
  const state = stateDoc ? decryptJSON(stateDoc.data) : null;
  if (!state) return NextResponse.json({ error: "No data yet." }, { status: 400 });

  const modelText = await callModel(buildPrompt(state));
  const html = modelText ? textToHtml(modelText) : heuristicReview(state);

  user.lastReviewAt = new Date();
  await user.save();
  return NextResponse.json({ html, source: modelText ? "ai" : "heuristic" });
}
