import Link from "next/link";
import { Download } from "lucide-react";

function formatAmount(amountInPaise, currency) {
  return `${currency === "INR" ? "₹" : currency + " "}${(amountInPaise / 100).toFixed(2)}`;
}

const STATUS_STYLES = {
  SUCCESS: "bg-green-50 text-success",
  CREATED: "bg-amber-50 text-amber-700",
  PENDING: "bg-amber-50 text-amber-700",
  FAILED: "bg-red-50 text-red-600",
  REFUNDED: "bg-blue-50 text-blue-700",
};

export default function PaymentHistoryTable({ payments }) {
  if (!payments.length) {
    return <p className="card p-6 text-center text-sm text-text-secondary">No payments yet.</p>;
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-text-secondary">
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Plan</th>
            <th className="px-4 py-3 font-semibold">Amount</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Reference</th>
            <th className="px-4 py-3 font-semibold">Invoice</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p._id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 text-text-secondary">
                {new Date(p.paidAt || p.createdAt).toLocaleDateString("en-IN")}
              </td>
              <td className="px-4 py-3 font-medium text-text">{p.planId?.name || "—"}</td>
              <td className="px-4 py-3 text-text">{formatAmount(p.amount, p.currency)}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[p.status] || ""}`}>
                  {p.status}
                </span>
                {p.refundStatus !== "NONE" && (
                  <span className="ml-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    Refund: {p.refundStatus}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-text-secondary">{p.razorpayPaymentId || "—"}</td>
              <td className="px-4 py-3">
                {p.status === "SUCCESS" ? (
                  <Link
                    href={`/api/payments/invoice/${p._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Download size={13} />
                    Download
                  </Link>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
