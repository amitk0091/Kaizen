import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

const FeelingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },   // 'YYYY-MM-DD', back-datable
  emotion: { type: String, required: true },
  intensity: { type: Number, min: 1, max: 5, default: 3 },
  note: { type: String, default: '' },
}, { timestamps: true });

FeelingSchema.index({ userId: 1, date: 1 });
export default models.Feeling || model('Feeling', FeelingSchema);
