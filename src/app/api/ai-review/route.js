import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import TrackerEntry from '@/models/TrackerEntry';
import Todo from '@/models/Todo';
import Goal from '@/models/Goal';
import Checklist from '@/models/Checklist';
import Feeling from '@/models/Feeling';
import Overthinking from '@/models/Overthinking';
import AiReview from '@/models/AiReview';
import { generateReview, detectCrisis } from '@/lib/ai';

const PER_DAY = parseInt(process.env.AI_REVIEWS_PER_DAY || '2', 10);
const fmt = (d) => d.toISOString().slice(0, 10);

export async function GET(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const day = searchParams.get('day') || fmt(new Date());
  const usedToday = await AiReview.countDocuments({ userId, day });
  const reviews = await AiReview.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
  return NextResponse.json({ reviews, usedToday, remaining: Math.max(0, PER_DAY - usedToday), perDay: PER_DAY });
}

export async function POST(req) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const gate = await requireWriteAccess(userId);
  if (gate.error) return gate.error;
  await dbConnect();

  const body = await req.json().catch(() => ({}));
  const today = body.day || fmt(new Date());
  // Enforce the 2/day cap server-side.
  const usedToday = await AiReview.countDocuments({ userId, day: today });
  if (usedToday >= PER_DAY) {
    return NextResponse.json({ error: 'limit_reached', message: `You can generate ${PER_DAY} AI reviews per day. Try again tomorrow.` }, { status: 429 });
  }

  const windowStart = fmt(new Date(Date.now() - 7 * 864e5));
  const [user, entries, todos, goals, checklists, feelings, over] = await Promise.all([
    User.findById(userId).lean(),
    TrackerEntry.find({ userId, date: { $gte: windowStart, $lte: today } }).sort({ date: 1 }).lean(),
    Todo.find({ userId }).lean(),
    Goal.find({ userId }).lean(),
    Checklist.find({ userId }).lean(),
    Feeling.find({ userId, date: { $gte: windowStart, $lte: today } }).lean(),
    Overthinking.find({ userId, date: { $gte: windowStart, $lte: today } }).lean(),
  ]);

  const goalSummary = goals.map((g) => {
    const total = g.subGoals?.length || 0;
    const done = (g.subGoals || []).filter((s) => s.done).length;
    return `- ${g.title} (${g.identity ? 'becoming ' + g.identity + '; ' : ''}${total ? Math.round((done / total) * 100) : 0}% done)`;
  }).join('\n');

  const todoSummary = `pending ${todos.filter(t=>t.status==='pending').length}, ongoing ${todos.filter(t=>t.status==='ongoing').length}, completed ${todos.filter(t=>t.status==='completed').length}`;
  const feelSummary = feelings.map((f) => `${f.date}: ${f.emotion} (${f.intensity}/5)`).join('; ') || 'none logged';
  const overSummary = over.map((o) => `${o.date}: ${o.thought}${o.inControl ? ' [in control]' : ' [not in control]'}`).join('; ') || 'none logged';
  const daysLogged = entries.length;

  const prompt = `You are Kaizen's performance coach. Your advice must follow evidence-based behavior science:
- Habit loop: cue -> craving -> routine -> reward; rewards must be immediate.
- Fogg B=MAP: a behavior needs Motivation, Ability, and a Prompt. If one failed, diagnose which.
- Ability beats motivation: shrink habits to a 2-minute version.
- Implementation intentions ("If [situation], then I will [action]") roughly double follow-through. Suggest self-authored ones.
- Identity-based habits: every action is a vote for who they are becoming.
- Never-miss-twice: a missed day is not failure. Be encouraging, never shaming.
- Habits take ~66 days (range 18-254) to automate; set realistic expectations.

USER CONTEXT
Identity goal: ${user?.identityStatement || 'not set'}
Onboarding answers: ${JSON.stringify(user?.onboardingAnswers || {}).slice(0, 800)}

LAST 7 DAYS DATA
Daily check-ins logged: ${daysLogged} of 7
Recent entries: ${JSON.stringify(entries.slice(-7).map((e) => ({ date: e.date, values: e.values }))).slice(0, 1500)}
Goals:\n${goalSummary || 'none'}
Todos: ${todoSummary}
Feelings: ${feelSummary}
Overthinking: ${overSummary}

Write a concise, warm, personalized weekly review with these exact sections using markdown headings:
## What went well
## What didn't go well
## Why (diagnosed with B=MAP)
## 3 tiny steps to improve
(For each step, give a self-authored-style "If ... then I will ..." plan anchored to an existing routine, kept to a 2-minute version.)
## A person who did this
(One short, real example of someone who succeeded via this kind of habit, matched to their situation.)
## Your identity this week
(One encouraging line about the votes they cast toward who they are becoming.)
Keep it under 450 words. Do not give medical or clinical advice.`;

  let result;
  try {
    result = await generateReview(prompt);
  } catch (e) {
    console.error('AI failed', e.message);
    return NextResponse.json({ error: 'ai_failed', message: 'AI is temporarily unavailable. Please try again.' }, { status: 502 });
  }

  let output = result.text;
  // Crisis safety net.
  const crisis = detectCrisis(JSON.stringify(over) + ' ' + JSON.stringify(feelings) + ' ' + output);
  if (crisis) {
    output += '\n\n---\n**You matter.** If you are struggling or thinking about harming yourself, please reach out to someone you trust or a professional. In India you can call the Tele-MANAS helpline at 14416. Kaizen is not a substitute for professional help.';
  }

  const saved = await AiReview.create({ userId, windowStart, windowEnd: today, output, model: result.model, day: today });
  return NextResponse.json({ review: saved, remaining: Math.max(0, PER_DAY - (usedToday + 1)) });
}
