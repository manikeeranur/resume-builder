"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, CircleUserRound, LogIn, LogOut } from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";
import CrownBadge from "./CrownBadge";
import AvatarImage from "@/components/ui/AvatarImage";

export default function AvatarMenu({ user, avatarUrl, isPremium, googleEnabled, showGreeting }) {
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const containerRef = useRef(null);
  const src = avatarUrl || user?.image || null;
  const initial = (user?.name || "?").charAt(0).toUpperCase();
  const firstName = (user?.name || "").trim().split(" ")[0] || "Account";

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

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
        >
          <LogIn size={15} />
          Sign in
        </button>
        {loginOpen && (
          <LoginModal
            googleEnabled={googleEnabled}
            onClose={() => setLoginOpen(false)}
            onSuccess={() => setLoginOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-bg"
      >
        <span className="relative flex h-9 w-9 shrink-0">
          {/* Sibling of the overflow-hidden span (not a child) so the badge
              isn't clipped by the avatar's own rounded-full overflow. */}
          <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-bold text-primary ring-2 ring-primary/30 ring-offset-2 transition-shadow hover:ring-primary/50">
            {initial}
            <AvatarImage src={src} alt={user?.name} className="absolute inset-0 h-full w-full object-cover" />
          </span>
          {isPremium && <CrownBadge />}
        </span>
        {showGreeting && (
          <span className="hidden items-center gap-1 sm:flex">
            <span className="whitespace-nowrap text-sm font-semibold text-text">Hi, {firstName}</span>
            <ChevronDown size={14} className={`text-text-secondary transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-72 overflow-hidden rounded-2xl border border-border bg-white shadow-card-lg">
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="relative flex h-11 w-11 shrink-0">
              <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-primary-light text-base font-bold text-primary ring-2 ring-primary/30 ring-offset-2">
                {initial}
                <AvatarImage src={src} alt={user?.name} className="absolute inset-0 h-full w-full object-cover" />
              </span>
              {isPremium && <CrownBadge size="md" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{user?.name}</p>
              <p className="truncate text-xs text-text-secondary">{user?.email}</p>
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="p-1.5">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text transition-colors hover:bg-bg"
            >
              <CircleUserRound size={17} className="text-text-secondary" />
              View Profile
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
