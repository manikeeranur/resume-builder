"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogIn, LogOut, Receipt } from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";
import CrownBadge from "./CrownBadge";
import AvatarImage from "@/components/ui/AvatarImage";
import RailTooltip from "@/components/ui/RailTooltip";

export default function UserMenu({ user, avatarUrl, isPremium, collapsed, googleEnabled }) {
  const [loginOpen, setLoginOpen] = useState(false);

  if (!user) {
    return (
      <>
        {loginOpen && (
          <LoginModal
            googleEnabled={googleEnabled}
            onClose={() => setLoginOpen(false)}
            onSuccess={() => setLoginOpen(false)}
          />
        )}
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              aria-label="Sign in"
              className="group relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-primary"
            >
              <LogIn size={15} />
              <RailTooltip>Sign in</RailTooltip>
            </button>
          </div>
        ) : (
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="flex items-center gap-2 text-sm font-semibold text-primary"
            >
              <LogIn size={15} />
              Sign in
            </button>
          </div>
        )}
      </>
    );
  }

  const src = avatarUrl || user.image;
  const avatar = (
    <span className="relative flex h-9 w-9 shrink-0">
      <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-bold text-primary ring-2 ring-primary/30 ring-offset-2">
        {(user.name || "?").charAt(0).toUpperCase()}
        <AvatarImage src={src} alt={user.name} className="absolute inset-0 h-full w-full object-cover" />
      </span>
      {isPremium && <CrownBadge />}
    </span>
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-t border-border pt-4">
        {avatar}
        <Link
          href="/account/subscription"
          aria-label="Subscription"
          className="group relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-primary"
        >
          <Receipt size={15} />
          <RailTooltip>Subscription</RailTooltip>
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/templates" })}
          aria-label="Sign out"
          className="group relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-primary"
        >
          <LogOut size={15} />
          <RailTooltip>Sign out</RailTooltip>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-t border-border pt-4">
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">{user.name}</p>
        <div className="flex items-center gap-2">
          <Link href="/account/subscription" className="text-xs font-medium text-text-secondary hover:text-primary">
            Subscription
          </Link>
          <span className="text-text-secondary">·</span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/templates" })}
            className="text-xs font-medium text-text-secondary hover:text-primary"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
