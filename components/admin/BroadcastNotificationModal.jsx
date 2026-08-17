"use client";

import { useState } from "react";
import { X } from "lucide-react";
import RippleButton from "@/components/ui/RippleButton";

// Same shape as SendNotificationModal, but targets every user at once via
// the broadcast route instead of a single user id.
export default function BroadcastNotificationModal({ onClose, onDone }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recipientCount, setRecipientCount] = useState(null);

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send broadcast");
      setRecipientCount(data.recipientCount);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-text">Notify all users</h3>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text">
            <X size={18} />
          </button>
        </div>

        {recipientCount !== null ? (
          <>
            <p className="text-sm text-text-secondary">
              Sent to <span className="font-medium text-text">{recipientCount}</span> user
              {recipientCount === 1 ? "" : "s"}.
            </p>
            <div className="mt-5 flex justify-end">
              <RippleButton type="button" onClick={onDone} className="btn-primary px-4 py-2 text-sm">
                Done
              </RippleButton>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-xs text-text-secondary">
              Shows up in every user's notification bell in-app — this can't be undone or targeted afterward.
            </p>

            <label className="block text-xs font-semibold text-text-secondary">Title</label>
            <input
              className="input-field mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              autoFocus
            />

            <label className="mt-3 block text-xs font-semibold text-text-secondary">Message</label>
            <textarea
              className="input-field mt-1 min-h-[140px] resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
            />

            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

            <div className="mt-5 flex justify-end gap-2.5">
              <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
                Cancel
              </button>
              <RippleButton
                type="button"
                disabled={loading || !title.trim() || !message.trim()}
                onClick={submit}
                className="btn-primary px-4 py-2 text-sm"
              >
                {loading ? "Sending…" : "Send to everyone"}
              </RippleButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
