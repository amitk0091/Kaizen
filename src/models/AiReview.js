import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

const AiReviewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  windowStart: { type: String },
  windowEnd: { type: String },
  output: { type: String, required: true },
  model: { type: String, default: 'gemini' },
  day: { type: String, required: true, index: true },  // 'YYYY-MM-DD' for 2/day cap
}, { timestamps: true });

AiReviewSchema.index({ userId: 1, day: 1 });
export default models.AiReview || model('AiReview', AiReviewSchema);
