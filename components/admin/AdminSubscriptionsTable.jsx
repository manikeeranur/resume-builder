"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Repeat, BadgeCheck, Clock, Ban, CalendarPlus, ArrowLeftRight, RotateCcw, History } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import AvatarImage from "@/components/ui/AvatarImage";
import Select from "@/components/ui/Select";
import CustomTable from "@/components/common/CustomTable";
import CustomThreeDotMenu from "@/components/common/CustomThreeDotMenu";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"].map((s) => ({ value: s, label: s })),
];

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
}
function remainingDays(expiryDate) {
  const ms = new Date(expiryDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

const STATUS_STYLES = {
  ACTIVE: "bg-green-50 text-success",
  PENDING: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-bg text-text-secondary",
  CANCELLED: "bg-red-50 text-red-600",
};

function Avatar({ name, photo }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-bold text-primary ring-2 ring-primary/20 ring-offset-2">
      {initial}
      <AvatarImage src={photo} alt={name} className="absolute inset-0 h-full w-full object-cover" />
    </span>
  );
}

// Days-left reads as plain text until it's actually close, then escalates to
// amber/red — a subscription with 45 days left doesn't need the same visual
// weight as one expiring in 2, and burying that signal in a table full of
// evenly-styled cells is exactly what made this hard to scan before.
function DaysLeft({ subscription }) {
  if (subscription.status !== "ACTIVE") return <span className="text-text-secondary">—</span>;
  const days = remainingDays(subscription.expiryDate);
  const tone = days <= 3 ? "text-red-600" : days <= 14 ? "text-amber-600" : "text-text";
  return (
    <span className={`font-semibold ${tone}`}>
      {days} day{days === 1 ? "" : "s"}
    </span>
  );
}

function ActionModal({ subscription, action, plans, onClose, onDone }) {
  const [days, setDays] = useState(30);
  const [planId, setPlanId] = useState(subscription.planId?._id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (action !== "history") return;
    fetch(`/api/admin/subscriptions/${subscription._id}`)
      .then((r) => r.json())
      .then((data) => setHistory(data.payments || []));
  }, [action, subscription._id]);

  const submit = async (body) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscription._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const title = { extend: "Extend subscription", changePlan: "Change plan", cancel: "Cancel subscription", reactivate: "Reactivate subscription", history: "Payment history" }[action];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text">{title}</h3>
            <p className="mt-0.5 text-xs text-text-secondary">{subscription.userId?.name || subscription.userId?.email}</p>
          </div>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text">
            <X size={18} />
          </button>
        </div>

        {action === "extend" && (
          <>
            <label className="block text-xs font-semibold text-text-secondary">Extend by (days)</label>
            <input
              type="number"
              min={1}
              className="input-field mt-1"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </>
        )}

        {action === "changePlan" && (
          <>
            <label className="block text-xs font-semibold text-text-secondary">New plan</label>
            <Select
              className="mt-1"
              value={planId}
              onChange={setPlanId}
              options={plans.map((p) => ({ value: p._id, label: p.name }))}
            />
          </>
        )}

        {(action === "cancel" || action === "reactivate") && (
          <p className="text-sm text-text-secondary">
            {action === "cancel"
              ? "This immediately revokes premium access for the user."
              : "This restores premium access, provided the subscription hasn't already expired."}
          </p>
        )}

        {action === "history" && (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {history === null && <p className="text-sm text-text-secondary">Loading…</p>}
            {history?.length === 0 && <p className="text-sm text-text-secondary">No payments for this subscription.</p>}
            {history?.map((p) => (
              <div key={p._id} className="rounded-lg border border-border p-2.5 text-xs">
                <div className="flex justify-between font-semibold text-text">
                  <span>
                    {p.currency} {(p.amount / 100).toFixed(2)}
                  </span>
                  <span>{p.status}</span>
                </div>
                <p className="mt-1 text-text-secondary">{new Date(p.createdAt).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        {action !== "history" && (
          <div className="mt-5 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (action === "extend") submit({ action: "extend", days: Number(days) });
                else if (action === "changePlan") submit({ action: "changePlan", planId });
                else submit({ action });
              }}
              className="btn-primary px-4 py-2 text-sm"
            >
              {loading ? "Saving…" : "Confirm"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSubscriptionsTable({ initialUser = "" }) {
  const [plans, setPlans] = useState([]);
  const [filters, setFilters] = useState({ user: initialUser, planId: "", status: "" });
  const [subscriptions, setSubscriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [counts, setCounts] = useState({ grandTotal: 0, active: 0, expiringSoon: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { subscription, action }
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then(setPlans)
      .catch(() => {});
  }, []);

  // Any filter change resets back to page 1 — staying on page 5 of a
  // now-different, shorter result set would just show an empty page.
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    params.set("page", String(page));
    params.set("limit", String(perPage));
    fetch(`/api/admin/subscriptions?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setSubscriptions(data.subscriptions || []);
        setTotal(data.total || 0);
        if (data.counts) setCounts(data.counts);
      })
      .finally(() => setLoading(false));
  }, [filters, page, perPage]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const columns = [
    {
      key: "user",
      title: "User",
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.userId?.name} photo={s.userId?.photo} />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{s.userId?.name || "—"}</p>
            <p className="truncate text-xs text-text-secondary">{s.userId?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "plan",
      title: "Plan",
      render: (s) => <p className="font-medium text-text">{s.planId?.name || "—"}</p>,
    },
    {
      key: "period",
      title: "Period",
      render: (s) => (
        <div className="text-text-secondary">
          <p>{formatDate(s.startDate)}</p>
          <p className="text-xs">to {formatDate(s.expiryDate)}</p>
        </div>
      ),
    },
    {
      key: "daysLeft",
      title: "Days left",
      render: (s) => <DaysLeft subscription={s} />,
    },
    {
      key: "status",
      title: "Status",
      render: (s) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[s.status] || ""}`}>{s.status}</span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (s) => {
        const openModal = (action) => setModal({ subscription: s, action });
        return (
          <CustomThreeDotMenu
            actions={[
              { label: "Extend", icon: <CalendarPlus size={14} />, onClick: () => openModal("extend") },
              { label: "Change plan", icon: <ArrowLeftRight size={14} />, onClick: () => openModal("changePlan") },
              s.status === "CANCELLED"
                ? { label: "Reactivate", icon: <RotateCcw size={14} />, onClick: () => openModal("reactivate") }
                : { label: "Cancel", icon: <Ban size={14} />, onClick: () => openModal("cancel"), destructive: true },
              { label: "Payment history", icon: <History size={14} />, onClick: () => openModal("history"), separatorBefore: true },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Repeat} value={counts.grandTotal} label="Total Subscriptions" tint={{ bg: "var(--primary-light)", fg: "var(--primary)" }} />
        <StatCard icon={BadgeCheck} value={counts.active} label="Active" tint={{ bg: "#dcfce7", fg: "#16a34a" }} />
        <StatCard icon={Clock} value={counts.expiringSoon} label="Expiring within 7 days" tint={{ bg: "#fef3c7", fg: "#b45309" }} />
        <StatCard icon={Ban} value={counts.cancelled} label="Cancelled" tint={{ bg: "#fee2e2", fg: "#dc2626" }} />
      </div>

      <div className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <input
          className="input-field"
          placeholder="Search user (name/email)"
          value={filters.user}
          onChange={(e) => setFilters({ ...filters, user: e.target.value })}
        />
        <Select
          value={filters.planId}
          onChange={(v) => setFilters({ ...filters, planId: v })}
          options={[{ value: "", label: "All plans" }, ...plans.map((p) => ({ value: p._id, label: p.name }))]}
          className="w-full"
        />
        <Select
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v })}
          options={STATUS_OPTIONS}
          className="w-full"
        />
      </div>

      <CustomTable
        columns={columns}
        data={subscriptions}
        loading={loading}
        emptyMessage="No subscriptions match these filters."
        rowKey="_id"
        perPageOptions={[10, 25, 50, 100]}
        paginationState={{ page, perPage, totalPages }}
        onPageChange={setPage}
        onPerPageChange={(next) => {
          setPerPage(next);
          setPage(1);
        }}
      />

      <p className="text-xs text-text-secondary">{total} matching filter(s)</p>

      {modal && (
        <ActionModal
          subscription={modal.subscription}
          action={modal.action}
          plans={plans}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}
