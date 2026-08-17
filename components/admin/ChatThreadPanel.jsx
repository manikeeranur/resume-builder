"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Paperclip } from "lucide-react";
import { uploadChatAttachment, CHAT_ATTACHMENT_ACCEPT } from "@/lib/chatUpload";
import ChatBubbleList from "@/components/chat/ChatBubbleList";
import { useToast } from "@/components/providers/ToastProvider";

const POLL_MS = 15000;

// The message list + composer for one user's thread — shared by
// UserChatModal (opened from the users table kebab menu) and
// AdminChatInbox (the standalone "all chats" screen), so both stay in sync
// with the same fetch/poll/mark-read logic instead of two copies drifting.
// partnerName/partnerPhoto label the user's own incoming bubbles with their
// real name — unlike ChatWidget's fixed "ResumePro" label, an admin sees
// exactly who they're talking to.
export default function ChatThreadPanel({ userId, partnerName, partnerPhoto }) {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const listRef = useRef(null);
  const fileInputRef = useRef(null);

  const load = useCallback(() => {
    fetch(`/api/admin/users/${userId}/chat`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setMessages(data.messages || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    load();
    fetch(`/api/admin/users/${userId}/chat`, { method: "PATCH" }).catch(() => {});
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load, userId]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (res.ok) setMessages((prev) => [...prev, data.message]);
    } catch {
      // Best-effort — the admin can just retype and resend.
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
      const attachment = await uploadChatAttachment(file, userId);
      const res = await fetch(`/api/admin/users/${userId}/chat`, {
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={listRef} className="flex-1 space-y-1 overflow-y-auto bg-[#efeae2] px-3 py-3">
        {loading ? (
          <p className="px-2 py-8 text-center text-sm text-text-secondary">Loading…</p>
        ) : (
          <ChatBubbleList
            messages={messages}
            outgoingRole="admin"
            emptyMessage="No messages yet."
            incomingLabel={partnerName}
            incomingPhoto={partnerPhoto}
          />
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
        <input ref={fileInputRef} type="file" accept={CHAT_ATTACHMENT_ACCEPT} className="hidden" onChange={handleFileSelect} />
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
  );
}
