"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Download, RotateCcw } from "lucide-react";
import AdminPaymentFilters from "./AdminPaymentFilters";
import RefundModal from "./RefundModal";

const EMPTY_FILTERS = { q: "", user: "", planId: "", status: "", refundStatus: "", from: "", to: "" };

function formatAmount(amountInPaise, currency) {
  return `${currency === "INR" ? "₹" : currency + " "}${(amountInPaise / 100).toFixed(2)}`;
}

export default function AdminPaymentsTable() {
  const [plans, setPlans] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refundTarget, setRefundTarget] = useState(null);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then(setPlans)
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    fetch(`/api/admin/payments?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setPayments(data.payments || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce filter typing
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <AdminPaymentFilters filters={filters} onChange={setFilters} plans={plans} />

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="sticky top-0 border-b border-border bg-white text-xs uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Refund</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-secondary">
                  No payments match these filters.
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p._id} className="border-b border-border align-top transition-colors last:border-0 hover:bg-bg">
                <td className="px-4 py-3">
                  <p className="font-mono text-xs text-text">{p._id}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-text-secondary">order: {p.razorpayOrderId}</p>
                  {p.razorpayPaymentId && (
                    <p className="font-mono text-[11px] text-text-secondary">pay: {p.razorpayPaymentId}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-text">{p.userId?.name || "—"}</p>
                  <p className="text-xs text-text-secondary">{p.userId?.email}</p>
                </td>
                <td className="px-4 py-3 text-text">{p.planId?.name || "—"}</td>
                <td className="px-4 py-3 text-text">{formatAmount(p.amount, p.currency)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-bg px-2 py-0.5 text-xs font-semibold text-text">{p.status}</span>
                  {p.failureReason && <p className="mt-1 text-[11px] text-red-600">{p.failureReason}</p>}
                </td>
                <td className="px-4 py-3 text-text">{p.refundStatus}</td>
                <td className="px-4 py-3 text-text-secondary">{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {p.status === "SUCCESS" && (
                      <Link
                        href={`/api/payments/invoice/${p._id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <Download size={12} /> Invoice
                      </Link>
                    )}
                    {p.status === "SUCCESS" && p.refundStatus === "NONE" && (
                      <button
                        type="button"
                        onClick={() => setRefundTarget(p)}
                        className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                      >
                        <RotateCcw size={12} /> Refund
                      </button>
                    )}
                    {p.userId?.email && (
                      <Link
                        href={`/admin/subscriptions?user=${encodeURIComponent(p.userId.email)}`}
                        className="text-xs font-semibold text-text-secondary hover:text-primary hover:underline"
                      >
                        Subscription
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-secondary">{total} payment(s)</p>

      {refundTarget && (
        <RefundModal
          payment={refundTarget}
          onClose={() => setRefundTarget(null)}
          onDone={() => {
            setRefundTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
