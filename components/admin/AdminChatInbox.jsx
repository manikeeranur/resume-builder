"use client";

import { useCallback, useEffect, useState } from "react";
import AvatarImage from "@/components/ui/AvatarImage";
import CrownBadge from "@/components/layout/CrownBadge";
import ChatThreadPanel from "./ChatThreadPanel";

const POLL_MS = 15000;

// Same ring treatment as the navbar's own avatar (components/layout/AvatarMenu.jsx)
// and the users table (components/admin/AdminUsersTable.jsx) — crown for an
// active paid plan, green dot for online — so a user looks the same here as
// everywhere else in the app.
function Avatar({ name, photo, isPremium, online, size = "h-9 w-9" }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <span className={`relative flex ${size} shrink-0`}>
      <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-bold text-primary ring-2 ring-primary/30 ring-offset-2">
        {initial}
        <AvatarImage src={photo} alt={name} className="absolute inset-0 h-full w-full object-cover" />
      </span>
      {isPremium && <CrownBadge />}
      {online && (
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500"
          title="Online"
          aria-label="Online"
        />
      )}
    </span>
  );
}

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

// Two-pane inbox — every user who has ever exchanged a chat message, most
// recent activity first, with the selected thread rendered via the same
// ChatThreadPanel the per-user modal uses.
export default function AdminChatInbox() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    fetch("/api/admin/chats")
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load chats (${r.status})`);
        return r.json();
      })
      .then((data) => {
        setError(null);
        setThreads(data?.threads || []);
      })
      .catch((err) => {
        console.error("AdminChatInbox load failed:", err);
        setError(err.message || "Failed to load chats");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const selectThread = (t) => {
    setSelected(t);
    // Optimistic — the panel itself marks these read server-side on mount;
    // this just clears the badge immediately instead of waiting for the
    // next poll.
    setThreads((prev) => prev.map((x) => (x.userId === t.userId ? { ...x, unreadCount: 0 } : x)));
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden border-t border-border bg-white md:grid-cols-[320px_1fr]">
      <div className="flex flex-col overflow-y-auto border-b border-border md:border-b-0 md:border-r">
        {loading ? (
          <p className="p-4 text-sm text-text-secondary">Loading…</p>
        ) : error ? (
          <p className="p-4 text-sm text-red-600">{error}</p>
        ) : threads.length === 0 ? (
          <p className="p-4 text-sm text-text-secondary">No conversations yet.</p>
        ) : (
          threads.map((t) => {
            const isSelected = selected?.userId === t.userId;
            return (
              <button
                key={t.userId}
                type="button"
                onClick={() => selectThread(t)}
                className={`flex items-center gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-bg ${
                  isSelected ? "bg-primary-light/40" : ""
                }`}
              >
                <Avatar name={t.name} photo={t.photo} isPremium={t.isPremium} online={t.online} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-text">{t.name}</p>
                    <span className="shrink-0 text-[10px] text-text-secondary">{timeAgo(t.lastAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-text-secondary">
                      {t.lastSenderRole === "admin" ? "You: " : ""}
                      {t.lastMessage || "Attachment"}
                    </p>
                    {t.unreadCount > 0 && (
                      <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {t.unreadCount > 9 ? "9+" : t.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="flex min-h-0 flex-col">
        {selected ? (
          <>
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <Avatar name={selected.name} photo={selected.photo} isPremium={selected.isPremium} online={selected.online} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-text">{selected.name}</p>
                  {selected.online && <span className="shrink-0 text-[11px] font-medium text-green-600">Online</span>}
                </div>
                <p className="truncate text-xs text-text-secondary">{selected.email}</p>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <ChatThreadPanel userId={selected.userId} partnerName={selected.name} partnerPhoto={selected.photo} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-text-secondary">
            Select a conversation to view messages.
          </div>
        )}
      </div>
    </div>
  );
}
