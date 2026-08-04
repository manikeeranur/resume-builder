"use client";

const STATUSES = ["CREATED", "PENDING", "SUCCESS", "FAILED", "REFUNDED"];
const REFUND_STATUSES = ["NONE", "INITIATED", "PROCESSED", "FAILED"];

export default function AdminPaymentFilters({ filters, onChange, plans }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
      <input
        className="input-field"
        placeholder="Search payment/order ID"
        value={filters.q}
        onChange={set("q")}
      />
      <input className="input-field" placeholder="Search user (name/email)" value={filters.user} onChange={set("user")} />
      <select className="input-field" value={filters.planId} onChange={set("planId")}>
        <option value="">All plans</option>
        {plans.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name}
          </option>
        ))}
      </select>
      <select className="input-field" value={filters.status} onChange={set("status")}>
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select className="input-field" value={filters.refundStatus} onChange={set("refundStatus")}>
        <option value="">All refund states</option>
        {REFUND_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <input type="date" className="input-field" value={filters.from} onChange={set("from")} />
        <input type="date" className="input-field" value={filters.to} onChange={set("to")} />
      </div>
    </div>
  );
}
