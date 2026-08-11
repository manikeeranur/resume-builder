import Link from "next/link";
import { IconRosetteDiscountCheckFilled, IconXboxXFilled } from "@tabler/icons-react";
import RazorpayCheckoutButton from "./RazorpayCheckoutButton";

function formatPrice(plan) {
  if (plan.price <= 0) return "Free";
  return `${plan.currency === "INR" ? "₹" : plan.currency}${plan.price}`;
}

function billingLabel(plan) {
  if (plan.billingType === "FREE") return "forever";
  if (plan.billingType === "MONTHLY") return "/ month";
  if (plan.billingType === "YEARLY") return "/ year";
  return "";
}

// Monthly and Yearly carry identical features (see featureList) — the only
// axis that ranks them is commitment/duration, so Yearly outranks Monthly
// the same way any paid plan outranks Free.
const BILLING_RANK = { FREE: 0, MONTHLY: 1, YEARLY: 2 };

// Every card lists the same feature labels, checked or crossed out per
// plan, so they compare at a glance instead of each card describing its own
// tier in different words (e.g. free's "basic colors" vs paid's "custom
// colors" for what's really the same yes/no feature).
function featureList(plan) {
  return [
    { label: plan.resumeLimit == null ? "Unlimited resumes" : `${plan.resumeLimit} resume${plan.resumeLimit === 1 ? "" : "s"}`, included: true },
    {
      label:
        plan.pdfDownloadLimit == null
          ? "Unlimited PDF downloads"
          : `${plan.pdfDownloadLimit} PDF download${plan.pdfDownloadLimit === 1 ? "" : "s"} / period`,
      included: true,
    },
    { label: "Premium templates", included: plan.premiumTemplateAccess },
    { label: "No watermark", included: !plan.watermarkEnabled },
    { label: "Custom colors", included: plan.customColors },
    { label: "Custom fonts", included: plan.customFonts },
  ];
}

export default function PlanCard({ plan, isCurrent, currentBillingType, user, highlighted }) {
  const isFree = plan.billingType === "FREE";
  // Yearly <-> Monthly is a billing-cycle change, not a feature upgrade —
  // both paid tiers have identical features, so framing it as "Upgrade"
  // when the admin is already on the other paid plan reads as a bug.
  const isSwitch = !isFree && currentBillingType && currentBillingType !== "FREE";
  // A plan ranked below the one the user is already paying for offers
  // nothing new — its features are a subset of what they already have —
  // so it's disabled rather than offered as a clickable action.
  const isLowerTier = user && currentBillingType && BILLING_RANK[plan.billingType] < BILLING_RANK[currentBillingType];

  return (
    <div
      className={`card relative flex flex-col gap-5 p-6 ${highlighted ? "ring-2 ring-primary" : ""}`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white shadow-card">
          Best value
        </span>
      )}
      <div>
        <h3 className="text-lg font-bold text-text">{plan.name}</h3>
        {/* min-h reserves space for a 2-line description even when this
            plan's own description is a single line, so the price row below
            starts at the same y-position across every card regardless of
            how long each plan's description happens to be. */}
        <p className="mt-1 min-h-[2.5rem] text-sm text-text-secondary">{plan.description}</p>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold text-text">{formatPrice(plan)}</span>
        {!isFree && <span className="text-sm font-medium text-text-secondary">{billingLabel(plan)}</span>}
      </div>

      <ul className="flex-1 space-y-2.5">
        {featureList(plan).map((f) => (
          <li key={f.label} className="flex items-start gap-2 text-sm text-text">
            {f.included ? (
              <IconRosetteDiscountCheckFilled size={16} className="mt-0.5 shrink-0 text-success" />
            ) : (
              <IconXboxXFilled size={16} className="mt-0.5 shrink-0 text-red-500" />
            )}
            <span>{f.label}</span>
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <span className="rounded-xl border border-border bg-bg px-4 py-2.5 text-center text-sm font-semibold text-text-secondary">
          Current plan
        </span>
      ) : isLowerTier ? (
        <span className="rounded-xl border border-border bg-bg px-4 py-2.5 text-center text-sm font-semibold text-text-secondary opacity-60">
          Included in your plan
        </span>
      ) : isFree ? (
        <Link
          href={user ? "/dashboard" : "/login"}
          className="btn-secondary block px-4 py-2.5 text-center text-sm"
        >
          {user ? "Continue with Free" : "Get started free"}
        </Link>
      ) : user ? (
        <RazorpayCheckoutButton plan={plan} user={user} className="btn-primary w-full px-4 py-2.5 text-sm">
          {isSwitch ? `Switch to ${plan.name}` : `Upgrade to ${plan.name}`}
        </RazorpayCheckoutButton>
      ) : (
        <Link href="/login" className="btn-primary block px-4 py-2.5 text-center text-sm">
          Sign in to upgrade
        </Link>
      )}
    </div>
  );
}
