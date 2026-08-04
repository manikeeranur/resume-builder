import Subscription from "@/lib/models/Subscription";

// Shared by payment verification, the webhook handler, and the admin
// "extend" action, so the start-from-today vs extend-from-expiry rule lives
// in exactly one place. `mongooseSession` is optional — pass it to run
// inside a transaction (payment verify/webhook do; admin actions don't need
// to since they're a single write).
export async function extendUserSubscription({ userId, plan, razorpayOrderId, razorpayPaymentId, mongooseSession }) {
  const opts = mongooseSession ? { session: mongooseSession } : {};

  const existing = await Subscription.findOne({ userId, status: "ACTIVE" })
    .sort({ createdAt: -1 })
    .setOptions(opts);

  const now = new Date();
  const durationMs = plan.durationDays * 24 * 60 * 60 * 1000;

  if (existing && existing.expiryDate > now) {
    existing.planId = plan._id;
    existing.expiryDate = new Date(existing.expiryDate.getTime() + durationMs);
    existing.status = "ACTIVE";
    if (razorpayOrderId) existing.razorpayOrderId = razorpayOrderId;
    if (razorpayPaymentId) existing.razorpayPaymentId = razorpayPaymentId;
    await existing.save(opts);
    return existing;
  }

  const [created] = await Subscription.create(
    [
      {
        userId,
        planId: plan._id,
        status: "ACTIVE",
        startDate: now,
        expiryDate: new Date(now.getTime() + durationMs),
        autoRenew: false,
        razorpayOrderId: razorpayOrderId || null,
        razorpayPaymentId: razorpayPaymentId || null,
      },
    ],
    opts
  );
  return created;
}
