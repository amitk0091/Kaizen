import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

// A completed (or stopped-early) deep-work session.
const Distraction = new Schema({
  text: { type: String, required: true },
  at: { type: Date, default: Date.now },
}, { _id: false });

const FocusSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },   // 'YYYY-MM-DD' (user local day the session started)
  todoId: { type: Schema.Types.ObjectId, ref: 'Todo', default: null },
  goalId: { type: Schema.Types.ObjectId, ref: 'Goal', default: null },
  label: { type: String, default: '' },
  plannedMin: { type: Number, required: true },
  actualMin: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  distractions: { type: [Distraction], default: [] },
}, { timestamps: true });

FocusSessionSchema.index({ userId: 1, date: 1 });
export default models.FocusSession || model('FocusSession', FocusSessionSchema);
