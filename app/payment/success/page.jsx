import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { CheckCircle2, LayoutGrid, FilePlus2, Receipt } from "lucide-react";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/lib/models/Payment";
import Plan from "@/lib/models/Plan";
import Subscription from "@/lib/models/Subscription";

function formatAmount(amountInPaise, currency) {
  return `${currency === "INR" ? "₹" : currency + " "}${(amountInPaise / 100).toFixed(2)}`;
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—";
}

// The redirect here only ever happens after /api/payments/verify already
// confirmed the payment server-side — this page just displays what's
// already true in the database, it never itself activates anything.
export default async function PaymentSuccessPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  await dbConnect();
  const payment = await Payment.findById(searchParams.paymentId).catch(() => null);
  if (!payment || payment.userId.toString() !== session.user.id || payment.status !== "SUCCESS") {
    redirect("/pricing");
  }

  const [plan, subscription] = await Promise.all([
    Plan.findById(payment.planId),
    payment.subscriptionId ? Subscription.findById(payment.subscriptionId) : null,
  ]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-12">
      <div className="card w-full p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-success">
          <CheckCircle2 size={28} />
        </span>
        <h1 className="mt-4 text-xl font-bold text-text">Payment successful</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your {plan?.name} plan is now active.
        </p>

        <dl className="mt-6 space-y-2 rounded-xl border border-border bg-bg p-4 text-left text-sm">
          <Row label="Plan" value={plan?.name} />
          <Row label="Amount paid" value={formatAmount(payment.amount, payment.currency)} />
          <Row label="Transaction reference" value={payment.razorpayPaymentId} mono />
          <Row label="Subscription start" value={formatDate(subscription?.startDate)} />
          <Row label="Subscription expiry" value={formatDate(subscription?.expiryDate)} />
        </dl>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link href="/dashboard" className="btn-primary flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm">
            <LayoutGrid size={16} />
            Go to Dashboard
          </Link>
          <Link href="/templates" className="btn-secondary flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm">
            <FilePlus2 size={16} />
            Create Resume
          </Link>
        </div>

        <Link
          href={`/api/payments/invoice/${payment._id}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <Receipt size={15} />
          Download invoice
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-text-secondary">{label}</dt>
      <dd className={`font-semibold text-text ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</dd>
    </div>
  );
}
