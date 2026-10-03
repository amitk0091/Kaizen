import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

const OverthinkingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },   // 'YYYY-MM-DD', back-datable
  thought: { type: String, required: true },
  trigger: { type: String, default: '' },
  inControl: { type: Boolean, default: false },
  note: { type: String, default: '' },
  // Work-through flow
  evidence: { type: String, default: '' },        // what's the actual evidence?
  friendAdvice: { type: String, default: '' },    // what would I tell a friend?
  nextAction: { type: String, default: '' },      // smallest next step (in control)
  status: { type: String, enum: ['open', 'actioned', 'released'], default: 'open' },
  todoId: { type: Schema.Types.ObjectId, ref: 'Todo', default: null },
}, { timestamps: true });

OverthinkingSchema.index({ userId: 1, date: 1 });
export default models.Overthinking || model('Overthinking', OverthinkingSchema);
