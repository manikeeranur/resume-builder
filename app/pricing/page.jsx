import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Plan from "@/lib/models/Plan";
import User from "@/lib/models/User";
import SessionAwareShell from "@/components/layout/SessionAwareShell";
import PricingPlans from "@/components/pricing/PricingPlans";
import { getUserPlan } from "@/lib/subscription/get-user-plan";

// Open to anonymous visitors (same as /templates) — plan data, prices and
// features are all read fresh from the database here; nothing about a plan
// is ever hardcoded into the client bundle. Lives outside both the
// (marketing) and (app) route groups — see SessionAwareShell for why.
export default async function PricingPage() {
  const session = await getServerSession(authOptions);

  await dbConnect();
  const plans = await Plan.find({ active: true }).sort({ price: 1 });

  let currentPlanCode = null;
  let currentBillingType = null;
  let user = null;
  if (session) {
    const [{ plan: currentPlan }, dbUser] = await Promise.all([
      getUserPlan(session.user.id),
      User.findById(session.user.id).select("name email phone"),
    ]);
    currentPlanCode = currentPlan.code;
    currentBillingType = currentPlan.billingType;
    user = { name: dbUser?.name, email: dbUser?.email, phone: dbUser?.phone };
  }

  return (
    <SessionAwareShell>
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-text">Pricing</h1>
        <p className="mt-1 text-sm text-text-secondary">Pick a plan that fits how often you're applying</p>
        <div className="mt-8">
          <PricingPlans
            plans={JSON.parse(JSON.stringify(plans))}
            currentPlanCode={currentPlanCode}
            currentBillingType={currentBillingType}
            user={user}
          />
        </div>
      </div>
    </SessionAwareShell>
  );
}
