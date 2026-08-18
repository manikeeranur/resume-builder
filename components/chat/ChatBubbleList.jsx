"use client";

import { useState } from "react";
import { Check, CheckCheck, Download, FileText, Trash2 } from "lucide-react";
import { sanitizeChatHtml } from "@/lib/sanitizeChatHtml";

// Attachments live on external CDNs (Cloudinary for uploads, Giphy for
// GIFs) that don't send Content-Disposition: attachment, so a plain
// `<a download>` just navigates instead of saving. Fetching as a blob and
// downloading that works regardless of origin, as long as the CDN allows
// cross-origin GETs (both do, since their URLs are meant to be embedded).
async function downloadAttachment(url, filename) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || "attachment";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Cross-origin fetch blocked or network error — fall back to a plain
    // open so the user can still get to the file via the browser's own
    // save option, rather than the click doing nothing.
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function dayLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function Attachment({ message, downloaded, onDownloaded }) {
  if (!message.attachmentUrl) return null;
  const name = message.attachmentName || "Attachment";
  const handleDownload = () => {
    downloadAttachment(message.attachmentUrl, name);
    onDownloaded();
  };
  if (message.attachmentType === "image") {
    return (
      <div className="group/attachment relative mt-1 inline-block">
        <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={message.attachmentUrl} alt={name} className="max-h-48 rounded-lg" />
        </a>
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Download attachment"
          title="Download"
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 focus-visible:opacity-100 group-hover/attachment:opacity-100"
        >
          <Download size={13} />
        </button>
        {downloaded && <p className="mt-0.5 text-right text-[10px] text-black/45">Downloaded</p>}
      </div>
    );
  }
  return (
    <div>
      <div className="mt-1 flex items-center gap-1.5 rounded-lg bg-black/10 px-2 py-1.5 text-xs text-[#111b21]">
        <FileText size={13} className="shrink-0" />
        <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="truncate underline">
          {name}
        </a>
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Download attachment"
          title="Download"
          className="ml-auto shrink-0 rounded-full p-1 text-[#111b21]/70 hover:bg-black/10 hover:text-[#111b21]"
        >
          <Download size={13} />
        </button>
      </div>
      {downloaded && <p className="mt-0.5 text-right text-[10px] text-black/45">Downloaded</p>}
    </div>
  );
}

// WhatsApp-style bubble list — shared by ChatWidget.jsx (user) and
// ChatThreadPanel.jsx (admin) so both surfaces of the same thread render
// identically: tail-shaped corners (flattened near corner instead of a true
// SVG tail), day dividers, and read-receipt checkmarks on the viewer's own
// outgoing messages. There's no separate "delivered" state — the backend
// only tracks read, so a single check means "sent, not yet read" and a
// blue double-check means "read," rather than WhatsApp's three-state
// sent/delivered/read.
//
// incomingLabel/incomingPhoto identify the *other* party for every
// non-outgoing bubble: on the user's widget that's always "ResumePro" (the
// support brand, not whichever individual admin replied — see
// lib/models/ChatMessage's "any admin can reply" comment), while on the
// admin side it's that specific user's own name/photo.
// onDeleteMessage is optional — when passed, a trash icon appears on hover
// over the caller's own outgoing bubbles: ChatThreadPanel passes it so an
// admin can delete their own replies, and ChatWidget passes it so a user
// can delete their own outgoing messages. Neither side can delete the
// other's messages — see the DELETE routes' senderRole scoping.
export default function ChatBubbleList({ messages, outgoingRole, emptyMessage, incomingLabel, incomingPhoto, onDeleteMessage }) {
  // Tracks which attachments the viewer has hit "download" on this session,
  // so a "Downloaded" note can appear under the attachment — separate from
  // the read-receipt checkmarks below, which only ever apply to the
  // viewer's own outgoing messages.
  const [downloadedIds, setDownloadedIds] = useState(() => new Set());

  if (messages.length === 0) {
    return <p className="px-2 py-8 text-center text-sm text-text-secondary">{emptyMessage}</p>;
  }

  return (
    <>
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const showDivider = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
        const outgoing = m.senderRole === outgoingRole;
        return (
          <div key={m._id}>
            {showDivider && (
              <div className="my-2 flex justify-center">
                <span className="rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-medium text-text-secondary shadow-sm">
                  {dayLabel(m.createdAt)}
                </span>
              </div>
            )}
            <div className={`group flex items-end gap-2 ${outgoing ? "justify-end" : "justify-start"}`}>
              {outgoing && onDeleteMessage && (
                <button
                  type="button"
                  onClick={() => onDeleteMessage(m._id)}
                  aria-label="Delete message"
                  className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-secondary opacity-0 hover:bg-white focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              )}
              {!outgoing && (
                <span className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-[10px] font-bold text-primary">
                  {incomingPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={incomingPhoto} alt={incomingLabel || ""} className="h-full w-full object-cover" />
                  ) : (
                    (incomingLabel || "?").charAt(0).toUpperCase()
                  )}
                </span>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  outgoing ? "rounded-br-sm bg-[#d9fdd3] text-[#111b21]" : "rounded-bl-sm bg-white text-[#111b21]"
                }`}
              >
                {!outgoing && incomingLabel && <p className="mb-0.5 text-[11px] font-semibold text-primary">{incomingLabel}</p>}
                {m.body && (
                  <div
                    className="whitespace-pre-wrap break-words [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_p]:m-0"
                    // Body is sanitized server-side on write (see
                    // lib/sanitizeChatHtml + the chat API routes); sanitizing
                    // again here is defense in depth, not the only guard.
                    dangerouslySetInnerHTML={{ __html: sanitizeChatHtml(m.body) }}
                  />
                )}
                <Attachment
                  message={m}
                  downloaded={downloadedIds.has(m._id)}
                  onDownloaded={() => setDownloadedIds((prev) => new Set(prev).add(m._id))}
                />
                <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-black/45">
                  {formatTime(m.createdAt)}
                  {outgoing && (m.read ? <CheckCheck size={13} className="text-sky-500" /> : <Check size={13} />)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
