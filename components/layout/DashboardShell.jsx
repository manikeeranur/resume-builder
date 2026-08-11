"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutGrid, LayoutTemplate, CircleUserRound, FileText, CreditCard, Crown, ShieldCheck } from "lucide-react";
import UserMenu from "./UserMenu";
import TopNavbar from "./TopNavbar";
import RailTooltip from "@/components/ui/RailTooltip";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
  { href: "/account/subscription", label: "Subscription", icon: Crown },
];

function navItemsFor(user) {
  if (user?.role !== "admin") return BASE_NAV_ITEMS;
  return [...BASE_NAV_ITEMS, { href: "/admin/payments", label: "Admin", icon: ShieldCheck }];
}

function useActiveNav(items) {
  const pathname = usePathname();
  return items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href || null;
}

function Logo({ collapsed }) {
  return (
    <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-bold text-white">
        R
      </span>
      {!collapsed && <span className="whitespace-nowrap text-lg font-bold text-text">ResumePro</span>}
    </div>
  );
}

function NavLinks({ items, active, collapsed, onNavigate }) {
  return (
    <nav className="flex-1 space-y-1.5">
      {items.map((item) => {
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

export default function DashboardShell({ user, avatarUrl, isPremium, googleEnabled, children }) {
  const items = navItemsFor(user);
  const active = useActiveNav(items);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg">
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
            <NavLinks items={items} active={active} onNavigate={() => setMobileOpen(false)} />
            <UserMenu user={user} avatarUrl={avatarUrl} isPremium={isPremium} googleEnabled={googleEnabled} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar — fixed to the viewport, full height, always icon-only */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex md:h-screen md:w-20 md:flex-col md:border-r md:border-border md:bg-white md:px-4 md:py-6">
        <div className="mb-8 px-1">
          <Logo collapsed />
        </div>
        <NavLinks items={items} active={active} collapsed />
        <UserMenu user={user} avatarUrl={avatarUrl} isPremium={isPremium} collapsed googleEnabled={googleEnabled} />
      </aside>

      <main className="min-w-0 md:ml-20">
        <TopNavbar user={user} avatarUrl={avatarUrl} isPremium={isPremium} googleEnabled={googleEnabled} />
        {children}
      </main>
    </div>
  );
}
