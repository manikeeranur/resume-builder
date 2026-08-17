"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, X } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const POLL_MS = 30000;

function timeAgo(date) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Polling this also doubles as this user's online-presence heartbeat — see
// the lastActiveAt comment on the User model and app/api/notifications.
export default function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const containerRef = useRef(null);

  const load = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!session) return;
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [session, load]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const markRead = async (notification) => {
    if (notification.read) return;
    setNotifications((prev) => prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    fetch(`/api/notifications/${notification._id}`, { method: "PATCH" }).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    }).catch(() => {});
  };

  const dismiss = (notification) => {
    setNotifications((prev) => prev.filter((n) => n._id !== notification._id));
    if (!notification.read) setUnreadCount((prev) => Math.max(0, prev - 1));
    fetch(`/api/notifications/${notification._id}`, { method: "DELETE" }).catch(() => {});
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    setClearConfirmOpen(false);
    fetch("/api/notifications", { method: "DELETE" }).catch(() => {});
  };

  if (!session) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg hover:text-text"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-border bg-white shadow-card-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-text">Notifications</p>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => setClearConfirmOpen(true)}
                  className="text-xs font-medium text-text-secondary hover:text-red-600 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-secondary">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => markRead(n)}
                  onKeyDown={(e) => e.key === "Enter" && markRead(n)}
                  className={`group relative flex w-full flex-col items-start gap-0.5 border-b border-border px-4 py-3 pr-9 text-left last:border-b-0 hover:bg-bg ${
                    n.read ? "" : "bg-primary-light/40"
                  }`}
                >
                  <div className="flex w-full items-center gap-2">
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-text">{n.title}</p>
                  </div>
                  <p className="line-clamp-2 text-xs text-text-secondary">{n.message}</p>
                  <p className="text-[11px] text-text-secondary">{timeAgo(n.createdAt)}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss(n);
                    }}
                    aria-label="Dismiss notification"
                    className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-text-secondary opacity-0 hover:bg-border hover:text-text group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={clearConfirmOpen}
        title="Clear all notifications?"
        confirmLabel="Clear all"
        destructive
        onConfirm={clearAll}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </div>
  );
}
