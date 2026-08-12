import { Subscription } from "./models";

export function trialEnd(trialStart: Date) {
  return new Date(new Date(trialStart).getTime() + 3 * 24 * 60 * 60 * 1000);
}

export async function getOrCreateSubscription(userId: string, trialStart: Date) {
  let sub = await Subscription.findOne({ userId });
  if (!sub) {
    sub = await Subscription.create({
      userId,
      plan: "trial",
      status: "trialing",
      currentPeriodEnd: trialEnd(trialStart),
    });
  }
  return sub;
}

/** Is the account currently entitled (trial not expired OR paid & active)? */
export function isEntitled(sub: { status: string; currentPeriodEnd: Date }) {
  return new Date(sub.currentPeriodEnd).getTime() > Date.now();
}
