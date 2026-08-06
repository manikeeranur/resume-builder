"use client";

import { useState } from "react";
import { X } from "lucide-react";
import RippleButton from "@/components/ui/RippleButton";

// Deleting a user cascades to every document they own (resumes,
// subscriptions, profile, payments, download logs) — see the DELETE handler
// in app/api/admin/users/[id]/route.js. That's irreversible, so this asks
// the admin to type the user's email before the button even enables,
// matching the "type to confirm" pattern used for other destructive
// deletes elsewhere (e.g. GitHub repo deletion) rather than a single click.
export default function DeleteUserModal({ user, onClose, onDone }) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      onDone();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-text">Delete user</h3>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-text-secondary">
          This permanently deletes <span className="font-semibold text-text">{user.name}</span> and all of their
          resumes, subscriptions, payments, and profile data. This can't be undone.
        </p>
        <label className="mt-4 block text-xs font-semibold text-text-secondary">
          Type <span className="font-mono text-text">{user.email}</span> to confirm
        </label>
        <input
          className="input-field mt-1"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
            Cancel
          </button>
          <RippleButton
            type="button"
            disabled={loading || confirmText !== user.email}
            onClick={submit}
            className="bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Deleting…" : "Delete user"}
          </RippleButton>
        </div>
      </div>
    </div>
  );
}
