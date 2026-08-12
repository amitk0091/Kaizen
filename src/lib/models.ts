import mongoose, { Schema, models, model } from "mongoose";

/** A user account. Kept intentionally minimal so signup/login is fast. */
const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    persona: { type: String, default: null },
    trialStart: { type: Date, default: () => new Date() },
    lastReviewAt: { type: Date, default: null }, // enforces 1 AI review/day
  },
  { timestamps: true }
);

/**
 * The whole app state for a user is stored as one document (data is small and
 * per-user). This makes offline-first sync simple and reliable: the client
 * mirrors this in IndexedDB and pushes/pulls the blob with last-write-wins.
 */
const UserStateSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    data: { type: Schema.Types.Mixed, default: {} },
    rev: { type: Number, default: 0 }, // increments on each server write
  },
  { timestamps: true }
);

const SubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    plan: { type: String, enum: ["trial", "monthly", "yearly"], default: "trial" },
    status: { type: String, enum: ["trialing", "active", "expired"], default: "trialing" },
    currentPeriodEnd: { type: Date, required: true },
    razorpayOrderId: String,
    razorpayPaymentId: String,
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
export const UserState = models.UserState || model("UserState", UserStateSchema);
export const Subscription = models.Subscription || model("Subscription", SubscriptionSchema);
