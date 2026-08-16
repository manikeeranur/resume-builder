"use client";

import { useState } from "react";
import { X } from "lucide-react";
import RippleButton from "@/components/ui/RippleButton";

// Shared by the users list (kebab menu) and the per-user detail page —
// same "send this user a one-off email" flow either way. Unlike
// ChangePlanModal/DeleteUserModal there's no follow-up data to refresh on
// success (nothing about the user record itself changes), so onDone just
// closes the modal.
export default function SendEmailModal({ user, onClose, onDone }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user._id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      setSent(true);
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
          <h3 className="text-base font-bold text-text">Email {user.name}</h3>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text">
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <>
            <p className="text-sm text-text-secondary">
              Sent to <span className="font-medium text-text">{user.email}</span>.
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
              Sent to <span className="font-medium text-text">{user.email}</span> as a plain notice, not from a
              template.
            </p>

            <label className="block text-xs font-semibold text-text-secondary">Subject</label>
            <input
              className="input-field mt-1"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              autoFocus
            />

            <label className="mt-3 block text-xs font-semibold text-text-secondary">Message</label>
            <textarea
              className="input-field mt-1 min-h-[140px] resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={10000}
              placeholder="Blank lines start a new paragraph."
            />

            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

            <div className="mt-5 flex justify-end gap-2.5">
              <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
                Cancel
              </button>
              <RippleButton
                type="button"
                disabled={loading || !subject.trim() || !message.trim()}
                onClick={submit}
                className="btn-primary px-4 py-2 text-sm"
              >
                {loading ? "Sending…" : "Send"}
              </RippleButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
