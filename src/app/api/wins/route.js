import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireUserId } from '@/lib/apiAuth';
import { dbConnect } from '@/lib/db';
import { bestStreak } from '@/lib/streak';
import DailyPlan from '@/models/DailyPlan';
import Goal from '@/models/Goal';
import Todo from '@/models/Todo';
import FocusSession from '@/models/FocusSession';
import Overthinking from '@/models/Overthinking';
import TrackerEntry from '@/models/TrackerEntry';

// GET: everything that proves progress, for the Wins wall and low-mood moments.
export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;
  await dbConnect();
  const [plans, goals, completedTodos, focus, released, entryDates] = await Promise.all([
    DailyPlan.find({ userId, 'wins.0': { $exists: true } }, { date: 1, wins: 1 }).sort({ date: -1 }).limit(365).lean(),
    Goal.find({ userId }, { title: 1, completed: 1, subGoals: 1, updatedAt: 1 }).lean(),
    Todo.countDocuments({ userId, status: 'completed' }),
    FocusSession.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(userId) } }, { $group: { _id: null, min: { $sum: '$actualMin' }, n: { $sum: 1 } } }]),
    Overthinking.countDocuments({ userId, status: 'released' }),
    TrackerEntry.find({ userId }, { date: 1 }).lean(),
  ]);

  const wins = plans.flatMap((p) => p.wins.map((text) => ({ date: p.date, text })));
  const completedGoals = goals
    .filter((g) => g.completed || (g.subGoals?.length && g.subGoals.every((s) => s.done)))
    .map((g) => ({ title: g.title, date: g.updatedAt }));
  const subGoalsDone = goals.reduce((n, g) => n + (g.subGoals || []).filter((s) => s.done).length, 0);

  return NextResponse.json({
    wins,
    completedGoals,
    stats: {
      completedTodos,
      subGoalsDone,
      focusMinutes: focus[0]?.min || 0,
      focusSessions: focus[0]?.n || 0,
      thoughtsReleased: released,
      checkIns: entryDates.length,
      bestStreak: bestStreak(entryDates.map((e) => e.date)),
    },
  });
}
