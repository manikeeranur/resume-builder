import Link from "next/link";
import { XCircle, RotateCcw, Mail, ArrowLeft } from "lucide-react";

// Standalone, unauthenticated-safe page — a failed checkout never touches
// the database (no Payment is marked FAILED here; /api/payments/verify or
// the webhook already did that, if a Payment record exists at all), so this
// is purely a display of the reason the client already has.
export default function PaymentFailedPage({ searchParams }) {
  const reason = searchParams?.reason || "The payment could not be completed.";
  const supportEmail = process.env.INVOICE_SUPPORT_EMAIL || "support@example.com";

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-12">
      <div className="card w-full p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <XCircle size={28} />
        </span>
        <h1 className="mt-4 text-xl font-bold text-text">Payment failed</h1>
        <p className="mt-1 text-sm text-text-secondary">{reason}</p>
        <p className="mt-3 text-xs text-text-secondary">
          No amount was deducted for this attempt, and no subscription was activated.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link href="/pricing" className="btn-primary flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm">
            <RotateCcw size={16} />
            Retry Payment
          </Link>
          <Link href="/pricing" className="btn-secondary flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm">
            <ArrowLeft size={16} />
            Back to Pricing
          </Link>
        </div>

        <a
          href={`mailto:${supportEmail}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <Mail size={15} />
          Contact support
        </a>
      </div>
    </div>
  );
}
