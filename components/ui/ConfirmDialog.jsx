"use client";

import RippleButton from "@/components/ui/RippleButton";

// Modal replacement for window.confirm() — every "are you sure?" flow in
// the app renders this instead, with the pending action's args held in the
// caller's own state (mirrors how SendEmailModal/DeleteUserModal etc.
// already manage their own open/close state).
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="card w-full max-w-sm p-6">
        <h3 className="text-base font-bold text-text">{title}</h3>
        {message && <p className="mt-2 text-sm text-text-secondary">{message}</p>}
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onCancel} disabled={loading} className="btn-secondary px-4 py-2 text-sm">
            Cancel
          </button>
          <RippleButton
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm ${destructive ? "bg-red-600 text-white hover:bg-red-700" : "btn-primary"}`}
          >
            {loading ? "Working…" : confirmLabel}
          </RippleButton>
        </div>
      </div>
    </div>
  );
}
