"use client";

import { useState } from "react";
import { X } from "lucide-react";
import RippleButton from "@/components/ui/RippleButton";

export default function RefundModal({ payment, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/payments/${payment._id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refund failed");
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
          <h3 className="text-base font-bold text-text">Initiate refund</h3>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-text-secondary">
          This refunds the full amount of{" "}
          <span className="font-semibold text-text">
            {payment.currency} {(payment.amount / 100).toFixed(2)}
          </span>{" "}
          via Razorpay. This can't be undone.
        </p>
        <label className="mt-4 block text-xs font-semibold text-text-secondary">Reason (optional)</label>
        <textarea
          className="input-field mt-1"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Requested by customer, duplicate charge, etc."
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
            Cancel
          </button>
          <RippleButton type="button" onClick={submit} disabled={loading} className="btn-primary px-4 py-2 text-sm">
            {loading ? "Processing…" : "Confirm refund"}
          </RippleButton>
        </div>
      </div>
    </div>
  );
}
