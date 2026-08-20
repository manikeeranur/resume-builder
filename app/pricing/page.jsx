import Link from "next/link";
import { getServerSession } from "next-auth";
import { Award, Headphones, RotateCcw, ShieldCheck } from "lucide-react";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Plan from "@/lib/models/Plan";
import User from "@/lib/models/User";
import SessionAwareShell from "@/components/layout/SessionAwareShell";
import PricingPlans from "@/components/pricing/PricingPlans";
import { getUserPlan } from "@/lib/subscription/get-user-plan";

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: "Secure & trusted", subtitle: "Your data is safe with us" },
  { icon: RotateCcw, title: "Cancel anytime", subtitle: "No hidden charges" },
  { icon: Headphones, title: "24/7 Support", subtitle: "We're here to help" },
];

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

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          {TRUST_ITEMS.map(({ icon: Icon, title, subtitle }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-text">{title}</p>
                <p className="text-xs text-text-secondary">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <PricingPlans
            plans={JSON.parse(JSON.stringify(plans))}
            currentPlanCode={currentPlanCode}
            currentBillingType={currentBillingType}
            user={user}
          />
        </div>

        <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
              <Award size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-text">30-day money-back guarantee</p>
              <p className="text-xs text-text-secondary">Not satisfied? Get a full refund within 30 days.</p>
            </div>
          </div>
          <Link href="/refund-policy" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Learn more →
          </Link>
        </div>
      </div>
    </SessionAwareShell>
  );
}
