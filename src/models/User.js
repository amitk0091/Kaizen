import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: '' },
  // Onboarding / personalization
  identityStatement: { type: String, default: '' },
  onboardingAnswers: { type: Schema.Types.Mixed, default: {} },
  onboardingComplete: { type: Boolean, default: false },
  preferences: { type: Schema.Types.Mixed, default: {} },
  // Trial + subscription
  trialStart: { type: Date, default: Date.now },
  trialEnd: { type: Date },
  subscriptionStatus: { type: String, enum: ['none', 'active', 'past_due', 'canceled', 'expired'], default: 'none' },
  plan: { type: String, enum: ['monthly', 'yearly', null], default: null },
  razorpayCustomerId: { type: String, default: null },
  razorpaySubscriptionId: { type: String, default: null },
  currentPeriodEnd: { type: Date, default: null },
}, { timestamps: true });

export default models.User || model('User', UserSchema);
