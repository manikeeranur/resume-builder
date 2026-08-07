"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, ShieldCheck, CreditCard, Repeat, Users, LayoutTemplate, ArrowLeft, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/subscriptions", label: "Subscriptions & Plans", icon: Repeat },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/templates", label: "Templates", icon: LayoutTemplate },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
        <ShieldCheck size={18} />
      </span>
      <span className="text-lg font-bold text-text">Admin</span>
    </div>
  );
}

function NavLinks({ active, onNavigate }) {
  return (
    <nav className="flex-1 space-y-1.5">
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-bg hover:text-text"
            }`}
          >
            <Icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Footer({ user }) {
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text">{user?.name}</p>
        <p className="truncate text-xs text-text-secondary">{user?.email}</p>
      </div>
      <Link href="/dashboard" className="flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-primary">
        <ArrowLeft size={13} />
        Exit to app
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:underline"
      >
        <LogOut size={13} />
        Sign out
      </button>
    </div>
  );
}

function useActiveNav() {
  const pathname = usePathname();
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href || null;
}

export default function AdminSidebar({ user }) {
  const active = useActiveNav();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-white px-4 py-3 md:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col bg-white px-5 py-6 shadow-card-lg">
            <div className="mb-8 flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg"
              >
                <X size={18} />
              </button>
            </div>
            <NavLinks active={active} onNavigate={() => setMobileOpen(false)} />
            <Footer user={user} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar — fixed, full labels (unlike the main app rail, the
          admin section has few enough items that icon-only would just add
          a hover step for no space savings that matters). */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-border md:bg-white md:px-5 md:py-6">
        <div className="mb-8">
          <Logo />
        </div>
        <NavLinks active={active} />
        <Footer user={user} />
      </aside>
    </>
  );
}
