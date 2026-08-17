"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import EmojiPicker from "emoji-picker-react";
import { Send, Paperclip, Type, Smile, Sticker, Plus, Bold, Italic, Strikethrough, Code2 } from "lucide-react";
import { uploadChatAttachment, CHAT_ATTACHMENT_ACCEPT } from "@/lib/chatUpload";
import ChatBubbleList from "@/components/chat/ChatBubbleList";
import { useToast } from "@/components/providers/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const POLL_MS = 15000;
const GIF_SEARCH_DEBOUNCE_MS = 400;

const FORMAT_OPTIONS = [
  { mark: "bold", label: "Bold", Icon: Bold, run: (e) => e.chain().focus().toggleBold().run() },
  { mark: "italic", label: "Italic", Icon: Italic, run: (e) => e.chain().focus().toggleItalic().run() },
  { mark: "strike", label: "Strikethrough", Icon: Strikethrough, run: (e) => e.chain().focus().toggleStrike().run() },
  { mark: "code", label: "Monospace", Icon: Code2, run: (e) => e.chain().focus().toggleCode().run() },
];

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
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openPopover, setOpenPopover] = useState(null); // "format" | "emoji" | "gif" | "more" | null
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const composerRef = useRef(null);
  const sendRef = useRef(() => {});
  // TipTap only notifies via onUpdate/onSelectionUpdate callbacks, not
  // React state — this forces a re-render so editor.isEmpty/isActive()
  // reads reflect the latest editor state in the JSX below.
  const [, bumpEditorState] = useReducer((c) => c + 1, 0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder: "Type a message…" }),
    ],
    editorProps: {
      attributes: { class: "min-w-0 flex-1 px-1.5 py-1.5 text-sm outline-none [&_p]:m-0" },
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendRef.current();
          return true;
        }
        return false;
      },
    },
    onUpdate: bumpEditorState,
    onSelectionUpdate: bumpEditorState,
    immediatelyRender: false,
  });

  useEffect(() => {
    editor?.setEditable(!uploading);
  }, [editor, uploading]);

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

  useEffect(() => {
    if (!openPopover) return;
    const onClickOutside = (e) => {
      if (composerRef.current && !composerRef.current.contains(e.target)) setOpenPopover(null);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [openPopover]);

  // Debounced Giphy search (trending on first open, then re-searches as the
  // admin types) — proxied through /api/admin/gif-search so the API key
  // never reaches the browser.
  useEffect(() => {
    if (openPopover !== "gif") return;
    setGifLoading(true);
    setGifError(null);
    const timer = setTimeout(() => {
      fetch(`/api/admin/gif-search?q=${encodeURIComponent(gifQuery)}`)
        .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
        .then(({ ok, data }) => {
          if (!ok) {
            setGifError(data.error || "GIF search failed");
            setGifResults([]);
          } else {
            setGifResults(data.gifs || []);
          }
        })
        .catch(() => setGifError("GIF search failed"))
        .finally(() => setGifLoading(false));
    }, gifQuery ? GIF_SEARCH_DEBOUNCE_MS : 0);
    return () => clearTimeout(timer);
  }, [openPopover, gifQuery]);

  const togglePopover = (name) =>
    setOpenPopover((cur) => {
      const next = cur === name ? null : name;
      if (next === "gif") setGifQuery("");
      return next;
    });

  const send = useCallback(async () => {
    if (!editor || editor.isEmpty || sending) return;
    const html = editor.getHTML();
    setSending(true);
    editor.commands.clearContent();
    try {
      const res = await fetch(`/api/admin/users/${userId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: html }),
      });
      const data = await res.json();
      if (res.ok) setMessages((prev) => [...prev, data.message]);
    } catch {
      // Best-effort — the admin can just retype and resend.
    } finally {
      setSending(false);
    }
  }, [editor, sending, userId]);

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

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

  const sendGif = async (gif) => {
    setOpenPopover(null);
    setSending(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "", attachmentUrl: gif.url, attachmentType: "image", attachmentName: "GIF" }),
      });
      const data = await res.json();
      if (res.ok) setMessages((prev) => [...prev, data.message]);
      else toast(data.error || "Failed to send GIF", { type: "error" });
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/chat/${deleteTarget}`, { method: "DELETE" });
      if (res.ok) setMessages((prev) => prev.filter((m) => m._id !== deleteTarget));
      else toast("Failed to delete message", { type: "error" });
    } catch {
      toast("Failed to delete message", { type: "error" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
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
            onDeleteMessage={setDeleteTarget}
          />
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-border p-3">
        <input ref={fileInputRef} type="file" accept={CHAT_ATTACHMENT_ACCEPT} className="hidden" onChange={handleFileSelect} />

        <div ref={composerRef} className="relative flex flex-1 items-end gap-0.5 rounded-2xl border border-border bg-white px-2 py-1">
          {openPopover === "format" && (
            <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 rounded-lg border border-border bg-white p-1.5 shadow-lg">
              {FORMAT_OPTIONS.map(({ mark, label, Icon, run }) => (
                <button
                  key={mark}
                  type="button"
                  onClick={() => editor && run(editor)}
                  aria-label={label}
                  title={label}
                  className={`flex h-8 w-8 items-center justify-center rounded-full hover:bg-bg ${
                    editor?.isActive(mark) ? "bg-bg text-primary" : "text-text-secondary"
                  }`}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          )}
          {openPopover === "emoji" && (
            <div className="absolute bottom-full left-0 mb-2 shadow-lg">
              <EmojiPicker
                onEmojiClick={(emojiData) => editor?.chain().focus().insertContent(emojiData.emoji).run()}
                width={300}
                height={360}
                previewConfig={{ showPreview: false }}
                lazyLoadEmojis
              />
            </div>
          )}
          {openPopover === "gif" && (
            <div className="absolute bottom-full left-0 mb-2 w-72 rounded-lg border border-border bg-white p-2 shadow-lg">
              <input
                autoFocus
                value={gifQuery}
                onChange={(e) => setGifQuery(e.target.value)}
                placeholder="Search GIFs…"
                className="input-field w-full py-1.5 text-sm"
              />
              <div className="mt-2 max-h-64 overflow-y-auto">
                {gifError ? (
                  <p className="px-1 py-6 text-center text-xs text-text-secondary">{gifError}</p>
                ) : gifLoading ? (
                  <p className="px-1 py-6 text-center text-xs text-text-secondary">Searching…</p>
                ) : gifResults.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-text-secondary">No GIFs found.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {gifResults.map((gif) => (
                      <button
                        key={gif.id}
                        type="button"
                        onClick={() => sendGif(gif)}
                        className="overflow-hidden rounded-md hover:opacity-80"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={gif.previewUrl} alt="" className="h-16 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {openPopover === "more" && (
            <div className="absolute bottom-full left-0 mb-2 w-40 rounded-lg border border-border bg-white p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setOpenPopover(null);
                  fileInputRef.current?.click();
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-text hover:bg-bg"
              >
                <Paperclip size={14} /> Attach file
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => togglePopover("format")}
            disabled={uploading}
            aria-label="Text formatting"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-bg disabled:opacity-50"
          >
            <Type size={16} />
          </button>
          <button
            type="button"
            onClick={() => togglePopover("emoji")}
            disabled={uploading}
            aria-label="Insert emoji"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-bg disabled:opacity-50"
          >
            <Smile size={16} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Attach a file"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-bg disabled:opacity-50"
          >
            <Paperclip size={16} />
          </button>

          <EditorContent editor={editor} className="min-w-0 flex-1" />

          <button
            type="button"
            onClick={() => togglePopover("gif")}
            disabled={uploading}
            aria-label="Send a GIF"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-bg disabled:opacity-50"
          >
            <Sticker size={16} />
          </button>
          <button
            type="button"
            onClick={() => togglePopover("more")}
            disabled={uploading}
            aria-label="More options"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-bg disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={send}
          disabled={sending || uploading || !editor || editor.isEmpty}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
        >
          <Send size={15} />
        </button>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this message?"
        message="This removes it for both you and the user. This can't be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
