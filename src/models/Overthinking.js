import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

const OverthinkingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },   // 'YYYY-MM-DD', back-datable
  thought: { type: String, required: true },
  trigger: { type: String, default: '' },
  inControl: { type: Boolean, default: false },
  note: { type: String, default: '' },
}, { timestamps: true });

OverthinkingSchema.index({ userId: 1, date: 1 });
export default models.Overthinking || model('Overthinking', OverthinkingSchema);
