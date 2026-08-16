"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ArrowLeft, LogOut } from "lucide-react";
import AvatarImage from "@/components/ui/AvatarImage";

// Mirrors components/layout/TopNavbar.jsx's sticky header for the regular
// user app, so the admin section has the same top bar the rest of the app
// does instead of only a sidebar.
export default function AdminTopNavbar({ user, avatarUrl }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const initial = (user?.name || "?").charAt(0).toUpperCase();
  const src = avatarUrl || user?.image || null;

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

  return (
    <div className="sticky top-0 z-10 hidden items-center justify-end border-b border-border bg-white/95 px-6 py-3 backdrop-blur-md md:flex">
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Admin account menu"
          aria-expanded={open}
          className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-bold text-primary ring-2 ring-primary/30 ring-offset-2 transition-shadow hover:ring-primary/50"
        >
          {initial}
          <AvatarImage src={src} alt={user?.name} className="absolute inset-0 h-full w-full object-cover" />
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-72 overflow-hidden rounded-2xl border border-border bg-white shadow-card-lg">
            <div className="flex items-center gap-3 px-4 py-4">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-base font-bold text-primary ring-2 ring-primary/30 ring-offset-2">
                {initial}
                <AvatarImage src={src} alt={user?.name} className="absolute inset-0 h-full w-full object-cover" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">{user?.name}</p>
                <p className="truncate text-xs text-text-secondary">{user?.email}</p>
              </div>
            </div>

            <div className="border-t border-border" />

            <div className="p-1.5">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text transition-colors hover:bg-bg"
              >
                <ArrowLeft size={17} className="text-text-secondary" />
                Exit to app
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
