"use client";

import { X } from "lucide-react";
import AvatarImage from "@/components/ui/AvatarImage";
import CrownBadge from "@/components/layout/CrownBadge";
import ChatThreadPanel from "./ChatThreadPanel";

export default function UserChatModal({ user, onClose }) {
  const initial = (user.name || "?").charAt(0).toUpperCase();
  const isPremium = Boolean(user.plan);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="card flex h-[32rem] w-full max-w-md flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2.5">
            {/* Same ring/crown/online treatment as the navbar's own avatar
                (components/layout/AvatarMenu.jsx) and the users table. */}
            <span className="relative flex h-9 w-9 shrink-0">
              <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-bold text-primary ring-2 ring-primary/30 ring-offset-2">
                {initial}
                <AvatarImage src={user.photo} alt={user.name} className="absolute inset-0 h-full w-full object-cover" />
              </span>
              {isPremium && <CrownBadge />}
              {user.online && (
                <span
                  className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500"
                  title="Online"
                  aria-label="Online"
                />
              )}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-sm font-bold text-text">{user.name}</h3>
                {user.online && <span className="shrink-0 text-[11px] font-medium text-green-600">Online</span>}
              </div>
              <p className="truncate text-xs text-text-secondary">{user.email}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text">
            <X size={18} />
          </button>
        </div>
        <ChatThreadPanel userId={user._id} partnerName={user.name} partnerPhoto={user.photo} />
      </div>
    </div>
  );
}
