"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { CircleUserRound, LogIn, LogOut } from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";

export default function AvatarMenu({ user, avatarUrl, googleEnabled }) {
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const containerRef = useRef(null);
  const src = avatarUrl || user?.image || null;
  const initial = (user?.name || "?").charAt(0).toUpperCase();

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
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-bold text-primary ring-2 ring-primary/30 ring-offset-2 transition-shadow hover:ring-primary/50"
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={user?.name} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-72 overflow-hidden rounded-2xl border border-border bg-white shadow-card-lg">
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-base font-bold text-primary">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={user?.name} className="h-full w-full object-cover" />
              ) : (
                initial
              )}
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
              onClick={() => signOut({ callbackUrl: "/templates" })}
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
