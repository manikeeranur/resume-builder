import dbConnect from "@/lib/db";
import Plan from "@/lib/models/Plan";
import Subscription from "@/lib/models/Subscription";

// Resolves what a user is actually entitled to right now: their active,
// unexpired Subscription + Plan, or the Free plan if they have none. Every
// server-side access check (resume limit, download limit, template access,
// watermark) goes through this — never through anything the client asserts.
export async function getUserPlan(userId) {
  await dbConnect();

  const subscription = await Subscription.findOne({ userId, status: "ACTIVE" }).sort({ createdAt: -1 });

  if (subscription) {
    if (subscription.expiryDate > new Date()) {
      const plan = await Plan.findById(subscription.planId);
      if (plan) return { plan, subscription };
    } else {
      // Lazily reconcile — the expiry-reminder/cron path isn't in scope
      // here, so a request-time check is what actually flips this.
      subscription.status = "EXPIRED";
      await subscription.save();
    }
  }

  const freePlan = await Plan.findOne({ billingType: "FREE" });
  if (!freePlan) {
    throw new Error("No Free plan is configured — run scripts/seedPlans.js");
  }
  return { plan: freePlan, subscription: null };
}
