"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Download, RotateCcw, Repeat } from "lucide-react";
import AdminPaymentFilters from "./AdminPaymentFilters";
import RefundModal from "./RefundModal";
import CustomTable from "@/components/common/CustomTable";
import CustomThreeDotMenu from "@/components/common/CustomThreeDotMenu";

const EMPTY_FILTERS = { q: "", user: "", planId: "", status: "", refundStatus: "", from: "", to: "" };

// Same tone convention as AdminSubscriptionsTable's STATUS_STYLES — amber
// for anything still in flight, green for success, red for failure.
const PAYMENT_STATUS_STYLES = {
  CREATED: "bg-amber-50 text-amber-700",
  PENDING: "bg-amber-50 text-amber-700",
  SUCCESS: "bg-green-50 text-success",
  FAILED: "bg-red-50 text-red-600",
  REFUNDED: "bg-slate-100 text-slate-600",
};

function formatAmount(amountInPaise, currency) {
  return `${currency === "INR" ? "₹" : currency + " "}${(amountInPaise / 100).toFixed(2)}`;
}

export default function AdminPaymentsTable() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [refundTarget, setRefundTarget] = useState(null);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then(setPlans)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    params.set("page", String(page));
    params.set("limit", String(perPage));
    fetch(`/api/admin/payments?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setPayments(data.payments || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [filters, page, perPage]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce filter typing
    return () => clearTimeout(t);
  }, [load]);

  const columns = [
    {
      key: "payment",
      title: "Payment",
      render: (p) => (
        <div>
          <p className="font-mono text-xs text-text">{p._id}</p>
          <p className="mt-0.5 font-mono text-[11px] text-text-secondary">order: {p.razorpayOrderId}</p>
          {p.razorpayPaymentId && <p className="font-mono text-[11px] text-text-secondary">pay: {p.razorpayPaymentId}</p>}
        </div>
      ),
    },
    {
      key: "user",
      title: "User",
      render: (p) => (
        <div>
          <p className="font-medium text-text">{p.userId?.name || "—"}</p>
          <p className="text-xs text-text-secondary">{p.userId?.email}</p>
        </div>
      ),
    },
    { key: "plan", title: "Plan", render: (p) => p.planId?.name || "—" },
    { key: "amount", title: "Amount", sortable: true, sortValue: (p) => p.amount, render: (p) => formatAmount(p.amount, p.currency) },
    {
      key: "status",
      title: "Status",
      render: (p) => (
        <div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_STYLES[p.status] || "bg-bg text-text"}`}
          >
            {p.status}
          </span>
          {p.failureReason && <p className="mt-1 text-[11px] text-red-600">{p.failureReason}</p>}
        </div>
      ),
    },
    { key: "refundStatus", title: "Refund" },
    {
      key: "createdAt",
      title: "Date",
      sortable: true,
      sortValue: (p) => new Date(p.createdAt),
      render: (p) => <span className="text-text-secondary">{new Date(p.createdAt).toLocaleDateString("en-IN")}</span>,
    },
    {
      key: "actions",
      title: "Actions",
      render: (p) => {
        const actions = [];
        if (p.status === "SUCCESS") {
          actions.push({
            label: "Invoice",
            icon: <Download size={14} />,
            onClick: () => window.open(`/api/payments/invoice/${p._id}`, "_blank"),
          });
        }
        if (p.status === "SUCCESS" && p.refundStatus === "NONE") {
          actions.push({
            label: "Refund",
            icon: <RotateCcw size={14} />,
            destructive: true,
            onClick: () => setRefundTarget(p),
          });
        }
        if (p.userId?.email) {
          actions.push({
            label: "View subscription",
            icon: <Repeat size={14} />,
            separatorBefore: actions.length > 0,
            onClick: () => router.push(`/admin/subscriptions?user=${encodeURIComponent(p.userId.email)}`),
          });
        }
        if (actions.length === 0) return <span className="text-text-secondary">—</span>;
        return <CustomThreeDotMenu actions={actions} />;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <AdminPaymentFilters filters={filters} onChange={setFilters} plans={plans} />

      <CustomTable
        columns={columns}
        data={payments}
        loading={loading}
        emptyMessage="No payments match these filters."
        rowKey="_id"
        perPageOptions={[10, 25, 50, 100]}
        paginationState={{ page, perPage, totalPages }}
        onPageChange={setPage}
        onPerPageChange={(next) => {
          setPerPage(next);
          setPage(1);
        }}
      />

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
