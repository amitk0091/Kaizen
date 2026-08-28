import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

// Goals with sub-goals. MVP: equal weightage -> progress = done subgoals / total.
const SubGoal = new Schema({
  subId: { type: String, required: true },
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
}, { _id: false });

const GoalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  identity: { type: String, default: '' },          // "becoming a ___"
  targetDate: { type: Date, default: null },
  ifThenPlan: { type: String, default: '' },         // implementation intention
  shieldingPlan: { type: String, default: '' },      // "If [temptation], then I will ___"
  subGoals: { type: [SubGoal], default: [] },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

export default models.Goal || model('Goal', GoalSchema);
