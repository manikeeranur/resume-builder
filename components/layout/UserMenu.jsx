"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function UserMenu({ user, avatarUrl, collapsed }) {
  const src = avatarUrl || user.image;
  const avatar = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-bold text-primary">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        (user.name || "?").charAt(0).toUpperCase()
      )}
    </span>
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-t border-border pt-4">
        {avatar}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Sign out"
          title="Sign out"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-primary"
        >
          <LogOut size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-t border-border pt-4">
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">{user.name}</p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs font-medium text-text-secondary hover:text-primary"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
