"use client";

import { Search, User, SlidersHorizontal, X } from "lucide-react";
import Select from "@/components/ui/Select";

const STATUSES = ["CREATED", "PENDING", "SUCCESS", "FAILED", "REFUNDED"];
const REFUND_STATUSES = ["NONE", "INITIATED", "PROCESSED", "FAILED"];
const EMPTY_FILTERS = { q: "", user: "", planId: "", status: "", refundStatus: "", from: "", to: "" };

const STATUS_OPTIONS = [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))];
const REFUND_OPTIONS = [
  { value: "", label: "All refund states" },
  ...REFUND_STATUSES.map((s) => ({ value: s, label: s })),
];

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-text-secondary">{label}</label>
      {children}
    </div>
  );
}

// Leading icons sit inside the input via an inline paddingLeft override —
// .input-field's own `padding` shorthand is declared after @tailwind
// utilities in globals.css, so it would otherwise beat a plain `pl-8` class
// in the cascade and the icon would end up sitting under the text.
function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
      <input {...props} className="input-field" style={{ paddingLeft: 32 }} />
    </div>
  );
}

export default function AdminPaymentFilters({ filters, onChange, plans }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const setValue = (key) => (value) => onChange({ ...filters, [key]: value });
  const activeCount = Object.values(filters).filter(Boolean).length;

  const planOptions = [{ value: "", label: "All plans" }, ...plans.map((p) => ({ value: p._id, label: p.name }))];

  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <SlidersHorizontal size={15} className="text-primary" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-bold text-primary">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="flex items-center gap-1 text-xs font-semibold text-text-secondary transition-colors hover:text-primary"
          >
            <X size={13} /> Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Field label="Payment / order ID">
          <IconInput icon={Search} placeholder="Search…" value={filters.q} onChange={set("q")} />
        </Field>

        <Field label="User">
          <IconInput icon={User} placeholder="Name or email" value={filters.user} onChange={set("user")} />
        </Field>

        <Field label="Plan">
          <Select value={filters.planId} onChange={setValue("planId")} options={planOptions} className="w-full" />
        </Field>

        <Field label="Status">
          <Select value={filters.status} onChange={setValue("status")} options={STATUS_OPTIONS} className="w-full" />
        </Field>

        <Field label="Refund state">
          <Select
            value={filters.refundStatus}
            onChange={setValue("refundStatus")}
            options={REFUND_OPTIONS}
            className="w-full"
          />
        </Field>

        <Field label="Date range">
          <div className="flex items-center gap-1.5">
            <input type="date" className="input-field" value={filters.from} onChange={set("from")} />
            <span className="shrink-0 text-text-secondary">–</span>
            <input type="date" className="input-field" value={filters.to} onChange={set("to")} />
          </div>
        </Field>
      </div>
    </div>
  );
}
