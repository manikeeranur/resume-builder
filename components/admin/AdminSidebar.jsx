"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, CreditCard, Crown, Users, LayoutTemplate, ArrowLeft, LogOut } from "lucide-react";
import AvatarImage from "@/components/ui/AvatarImage";
import RailTooltip from "@/components/ui/RailTooltip";

const NAV_ITEMS = [
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/subscriptions", label: "Subscriptions & Plans", icon: Crown },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/templates", label: "Templates", icon: LayoutTemplate },
];

function Logo({ collapsed }) {
  return (
    <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="ResumePro" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
      {!collapsed && <span className="whitespace-nowrap text-sm font-bold text-text">Admin</span>}
    </div>
  );
}

function NavLinks({ active, collapsed, onNavigate }) {
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
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              collapsed ? "justify-center" : ""
            } ${isActive ? "bg-primary-light text-primary shadow-sm" : "text-text-secondary hover:bg-bg hover:text-text"}`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                isActive ? "bg-primary text-white" : "bg-bg text-text-secondary group-hover:text-text"
              }`}
            >
              <Icon size={16} />
            </span>
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            {collapsed && <RailTooltip>{item.label}</RailTooltip>}
          </Link>
        );
      })}
    </nav>
  );
}

function Footer({ user, avatarUrl, collapsed }) {
  const initial = (user?.name || "?").charAt(0).toUpperCase();
  const avatar = (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-bold text-primary ring-2 ring-primary/30 ring-offset-2">
      {initial}
      <AvatarImage src={avatarUrl || user?.image} alt={user?.name} className="absolute inset-0 h-full w-full object-cover" />
    </span>
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-t border-border pt-4">
        {avatar}
        <Link
          href="/dashboard"
          aria-label="Exit to app"
          className="group relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-primary"
        >
          <ArrowLeft size={15} />
          <RailTooltip>Exit to app</RailTooltip>
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          aria-label="Sign out"
          className="group relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-red-600"
        >
          <LogOut size={15} />
          <RailTooltip>Sign out</RailTooltip>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center gap-3">
        {avatar}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">{user?.name}</p>
          <p className="truncate text-xs text-text-secondary">{user?.email}</p>
        </div>
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

export default function AdminSidebar({ user, avatarUrl }) {
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

      {/* Mobile drawer — full labels, unlike the collapsed desktop rail
          below, since there's no persistent top navbar item to fall back
          on for identifying a nav item by icon alone on a small screen. */}
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
            <Footer user={user} avatarUrl={avatarUrl} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar — fixed, collapsed to an icon-only rail like the
          main app's own DashboardShell rail (components/layout/DashboardShell.jsx),
          so admin and regular-user chrome match instead of the admin side
          alone spelling out labels in a wider column. */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex md:h-screen md:w-20 md:flex-col md:border-r md:border-border md:bg-white md:px-4 md:py-6">
        <div className="mb-8 px-1">
          <Logo collapsed />
        </div>
        <NavLinks active={active} collapsed />
        <Footer user={user} avatarUrl={avatarUrl} collapsed />
      </aside>
    </>
  );
}
