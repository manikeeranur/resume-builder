"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import RippleButton from "@/components/ui/RippleButton";

// Shared by the users list (kebab menu) and the per-user detail page — both
// need the same "assign this user a plan" flow: PATCH the existing active
// subscription if they have one, otherwise POST a new one (see
// app/api/admin/subscriptions/route.js for why a Free-tier user has none).
export default function ChangePlanModal({ userId, subscriptionId, currentPlanId, onClose, onDone }) {
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState(currentPlanId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data);
        setPlanId((prev) => prev || data[0]?._id || "");
      })
      .catch(() => {});
  }, []);

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = subscriptionId
        ? await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "changePlan", planId }),
          })
        : await fetch(`/api/admin/subscriptions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, planId }),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change plan");
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-text">Change plan</h3>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text">
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs font-semibold text-text-secondary">New plan</label>
        <select className="input-field mt-1" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {plans.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
            Cancel
          </button>
          <RippleButton type="button" disabled={loading || !planId} onClick={submit} className="btn-primary px-4 py-2 text-sm">
            {loading ? "Saving…" : "Confirm"}
          </RippleButton>
        </div>
      </div>
    </div>
  );
}
