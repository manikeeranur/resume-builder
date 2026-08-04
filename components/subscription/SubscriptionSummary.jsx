import Link from "next/link";
import { Check, X } from "lucide-react";

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—";
}

function remainingDays(expiryDate) {
  if (!expiryDate) return null;
  const ms = new Date(expiryDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function Feature({ ok, label }) {
  return (
    <li className="flex items-center gap-2 text-sm text-text">
      {ok ? <Check size={15} className="text-success" /> : <X size={15} className="text-text-secondary" />}
      <span className={ok ? "" : "text-text-secondary"}>{label}</span>
    </li>
  );
}

export default function SubscriptionSummary({ plan, subscription }) {
  const isPaid = plan.billingType !== "FREE";
  const days = subscription ? remainingDays(subscription.expiryDate) : null;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Current plan</p>
          <h2 className="mt-1 text-2xl font-bold text-text">{plan.name}</h2>
          {subscription && (
            <span
              className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                subscription.status === "ACTIVE"
                  ? "bg-green-50 text-success"
                  : subscription.status === "PENDING"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {subscription.status}
            </span>
          )}
        </div>
        <div className="flex gap-2.5">
          <Link href="/pricing" className="btn-primary px-4 py-2.5 text-sm">
            {isPaid ? "Renew / Change Plan" : "Upgrade"}
          </Link>
        </div>
      </div>

      {isPaid && subscription && (
        <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-border bg-bg p-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-text-secondary">Start date</dt>
            <dd className="mt-0.5 text-sm font-semibold text-text">{formatDate(subscription.startDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">Expiry date</dt>
            <dd className="mt-0.5 text-sm font-semibold text-text">{formatDate(subscription.expiryDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">Days remaining</dt>
            <dd className="mt-0.5 text-sm font-semibold text-text">{days ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">Auto-renew</dt>
            <dd className="mt-0.5 text-sm font-semibold text-text">{subscription.autoRenew ? "On" : "Off"}</dd>
          </div>
        </dl>
      )}

      <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Feature ok={plan.resumeLimit == null} label={plan.resumeLimit == null ? "Unlimited resumes" : `${plan.resumeLimit} resume limit`} />
        <Feature
          ok={plan.pdfDownloadLimit == null}
          label={plan.pdfDownloadLimit == null ? "Unlimited PDF downloads" : `${plan.pdfDownloadLimit} downloads / period`}
        />
        <Feature ok={plan.premiumTemplateAccess} label="Premium templates" />
        <Feature ok={!plan.watermarkEnabled} label="No watermark" />
        <Feature ok={plan.customColors} label="Custom colors" />
        <Feature ok={plan.customFonts} label="Custom fonts" />
      </ul>
    </div>
  );
}
