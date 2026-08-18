"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, Paperclip } from "lucide-react";
import { uploadChatAttachment, CHAT_ATTACHMENT_ACCEPT } from "@/lib/chatUpload";
import ChatBubbleList from "@/components/chat/ChatBubbleList";
import { useToast } from "@/components/providers/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const POLL_MS = 15000;

// Floating support-chat widget — a single thread per user with admin
// (any admin can reply, see lib/models/ChatMessage), mirrors
// NotificationBell's polling approach for the same reason: no WebSockets on
// Vercel serverless.
export default function ChatWidget() {
  const { data: session } = useSession();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const listRef = useRef(null);
  const fileInputRef = useRef(null);

  const load = useCallback(() => {
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setMessages(data.messages || []);
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
    fetch("/api/chat", { method: "PATCH" }).catch(() => {});
    setUnreadCount(0);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (res.ok) setMessages((prev) => [...prev, data.message]);
    } catch {
      // Best-effort — the user can just retype and resend.
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || uploading) return;
    setUploading(true);
    try {
      const attachment = await uploadChatAttachment(file, session.user.id);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "", ...attachment }),
      });
      const data = await res.json();
      if (res.ok) setMessages((prev) => [...prev, data.message]);
      else toast(data.error || "Failed to send attachment", { type: "error" });
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/chat/${deleteTarget}`, { method: "DELETE" });
      if (res.ok) setMessages((prev) => prev.filter((m) => m._id !== deleteTarget));
      else toast("Failed to delete message", { type: "error" });
    } catch {
      toast("Failed to delete message", { type: "error" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (!session) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 max-w-[85vw] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card-lg">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
            <p className="text-sm font-semibold text-text">ResumePro Support</p>
            <button type="button" onClick={() => setOpen(false)} className="ml-auto text-text-secondary hover:text-text">
              <X size={16} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-1 overflow-y-auto bg-[#efeae2] px-3 py-3">
            <ChatBubbleList
              messages={messages}
              outgoingRole="user"
              emptyMessage="Send a message and an admin will get back to you here."
              incomingLabel="ResumePro"
              incomingPhoto="/logo.png"
              onDeleteMessage={setDeleteTarget}
            />
          </div>

          <div className="flex items-center gap-2 border-t border-border p-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept={CHAT_ATTACHMENT_ACCEPT}
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Attach a file"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-bg disabled:opacity-50"
            >
              <Paperclip size={16} />
            </button>
            <input
              className="input-field flex-1 py-2 text-sm"
              placeholder={uploading ? "Uploading…" : "Type a message…"}
              value={draft}
              maxLength={4000}
              disabled={uploading}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || uploading || !draft.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with support"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-card-lg transition-transform hover:scale-105"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this message?"
        message="This removes it for both you and support. This can't be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
