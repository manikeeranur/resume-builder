"use client";

import { Check, CheckCheck, FileText } from "lucide-react";

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

function Attachment({ message }) {
  if (!message.attachmentUrl) return null;
  if (message.attachmentType === "image") {
    return (
      <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={message.attachmentUrl} alt={message.attachmentName || "Attachment"} className="max-h-48 rounded-lg" />
      </a>
    );
  }
  return (
    <a
      href={message.attachmentUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 flex items-center gap-1.5 rounded-lg bg-black/10 px-2 py-1.5 text-xs text-[#111b21] underline"
    >
      <FileText size={13} className="shrink-0" />
      <span className="truncate">{message.attachmentName || "Attachment"}</span>
    </a>
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
export default function ChatBubbleList({ messages, outgoingRole, emptyMessage, incomingLabel, incomingPhoto }) {
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
            <div className={`flex items-end gap-2 ${outgoing ? "justify-end" : "justify-start"}`}>
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
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                <Attachment message={m} />
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
