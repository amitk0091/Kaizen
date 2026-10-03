import mongoose from 'mongoose';
import Goal from '@/models/Goal';

// Returns the goal id only if it belongs to this user; otherwise null.
export async function resolveOwnedGoalId(userId, goalId) {
  if (!goalId || !mongoose.isValidObjectId(goalId)) return null;
  const goal = await Goal.exists({ _id: goalId, userId });
  return goal ? goal._id : null;
}
