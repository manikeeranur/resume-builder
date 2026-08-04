import Link from "next/link";
import { Check } from "lucide-react";
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

function featureList(plan) {
  return [
    plan.resumeLimit == null ? "Unlimited resumes" : `${plan.resumeLimit} resume${plan.resumeLimit === 1 ? "" : "s"}`,
    plan.pdfDownloadLimit == null
      ? "Unlimited PDF downloads"
      : `${plan.pdfDownloadLimit} PDF download${plan.pdfDownloadLimit === 1 ? "" : "s"} / period`,
    plan.premiumTemplateAccess ? "All premium templates" : "Free templates only",
    plan.watermarkEnabled ? "Watermark on exports" : "No watermark",
    plan.customColors ? "Custom colors" : "Basic colors",
    plan.customFonts ? "Custom fonts" : "Basic fonts",
  ];
}

export default function PlanCard({ plan, isCurrent, user, highlighted }) {
  const isFree = plan.billingType === "FREE";

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
        {plan.description && <p className="mt-1 text-sm text-text-secondary">{plan.description}</p>}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold text-text">{formatPrice(plan)}</span>
        {!isFree && <span className="text-sm font-medium text-text-secondary">{billingLabel(plan)}</span>}
      </div>

      <ul className="flex-1 space-y-2.5">
        {featureList(plan).map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-text">
            <Check size={16} className="mt-0.5 shrink-0 text-success" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <span className="rounded-xl border border-border bg-bg px-4 py-2.5 text-center text-sm font-semibold text-text-secondary">
          Current plan
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
          Upgrade to {plan.name}
        </RazorpayCheckoutButton>
      ) : (
        <Link href="/login" className="btn-primary block px-4 py-2.5 text-center text-sm">
          Sign in to upgrade
        </Link>
      )}
    </div>
  );
}
