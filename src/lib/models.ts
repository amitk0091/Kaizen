import { Schema, Types, models, model, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  persona: string | null;
  trialStart: Date;
  lastReviewAt: Date | null;
}

export interface IUserState extends Document {
  userId: Types.ObjectId;
  data: unknown;
  rev: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  plan: "trial" | "monthly" | "yearly";
  status: "trialing" | "active" | "expired";
  currentPeriodEnd: Date;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

/** A user account. Kept intentionally minimal so signup/login is fast. */
const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    persona: { type: String, default: null },
    trialStart: { type: Date, default: () => new Date() },
    lastReviewAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/**
 * The whole app state for a user is stored as one document (data is small and
 * per-user). This makes offline-first sync simple and reliable: the client
 * mirrors this in IndexedDB and pushes/pulls the blob with last-write-wins.
 */
const UserStateSchema = new Schema<IUserState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    data: { type: Schema.Types.Mixed, default: {} },
    rev: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SubscriptionSchema = new Schema<ISubscription>(
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

export const User: Model<IUser> = (models.User as Model<IUser>) || model<IUser>("User", UserSchema);
export const UserState: Model<IUserState> = (models.UserState as Model<IUserState>) || model<IUserState>("UserState", UserStateSchema);
export const Subscription: Model<ISubscription> = (models.Subscription as Model<ISubscription>) || model<ISubscription>("Subscription", SubscriptionSchema);
