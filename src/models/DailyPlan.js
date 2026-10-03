import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

// One plan per user-day: morning Top 3 + evening shutdown.
const DailyPlanSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },                         // 'YYYY-MM-DD' (user local day)
  top: [{ type: Schema.Types.ObjectId, ref: 'Todo' }],            // up to 3 todos
  oneThing: { type: Schema.Types.ObjectId, ref: 'Todo', default: null },
  // Evening shutdown
  wins: { type: [String], default: [] },                          // "Three Good Things"
  slipped: { type: String, default: '' },
  shutdownDone: { type: Boolean, default: false },
}, { timestamps: true });

DailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });
export default models.DailyPlan || model('DailyPlan', DailyPlanSchema);
