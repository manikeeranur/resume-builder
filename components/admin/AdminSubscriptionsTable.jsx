"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString("en-IN") : "—";
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
          <h3 className="text-base font-bold text-text">{title}</h3>
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
            <select className="input-field mt-1" value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
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
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { subscription, action }

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
    fetch(`/api/admin/subscriptions?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setSubscriptions(data.subscriptions || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <input
          className="input-field"
          placeholder="Search user (name/email)"
          value={filters.user}
          onChange={(e) => setFilters({ ...filters, user: e.target.value })}
        />
        <select
          className="input-field"
          value={filters.planId}
          onChange={(e) => setFilters({ ...filters, planId: e.target.value })}
        >
          <option value="">All plans</option>
          {plans.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="input-field"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All statuses</option>
          {["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3 font-semibold">Subscription</th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Start</th>
              <th className="px-4 py-3 font-semibold">Expiry</th>
              <th className="px-4 py-3 font-semibold">Days left</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Payment ref</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && subscriptions.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-text-secondary">
                  No subscriptions match these filters.
                </td>
              </tr>
            )}
            {subscriptions.map((s) => (
              <tr key={s._id} className="border-b border-border align-top last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-text">{s._id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-text">{s.userId?.name || "—"}</p>
                  <p className="text-xs text-text-secondary">{s.userId?.email}</p>
                </td>
                <td className="px-4 py-3 text-text">{s.planId?.name || "—"}</td>
                <td className="px-4 py-3 text-text-secondary">{formatDate(s.startDate)}</td>
                <td className="px-4 py-3 text-text-secondary">{formatDate(s.expiryDate)}</td>
                <td className="px-4 py-3 text-text">{s.status === "ACTIVE" ? remainingDays(s.expiryDate) : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[s.status] || ""}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-text-secondary">{s.razorpayPaymentId || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <button type="button" className="text-primary hover:underline" onClick={() => setModal({ subscription: s, action: "extend" })}>
                      Extend
                    </button>
                    <button type="button" className="text-primary hover:underline" onClick={() => setModal({ subscription: s, action: "changePlan" })}>
                      Change plan
                    </button>
                    {s.status === "CANCELLED" ? (
                      <button type="button" className="text-success hover:underline" onClick={() => setModal({ subscription: s, action: "reactivate" })}>
                        Reactivate
                      </button>
                    ) : (
                      <button type="button" className="text-red-600 hover:underline" onClick={() => setModal({ subscription: s, action: "cancel" })}>
                        Cancel
                      </button>
                    )}
                    <button type="button" className="text-text-secondary hover:underline" onClick={() => setModal({ subscription: s, action: "history" })}>
                      History
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-secondary">{total} subscription(s)</p>

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
