"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, CreditCard, Repeat, ArrowLeft } from "lucide-react";

const LINKS = [
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/subscriptions", label: "Subscriptions & Plans", icon: Repeat },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-bold text-text">
          <ShieldCheck size={18} className="text-primary" />
          Admin
        </div>
        <nav className="flex items-center gap-1.5">
          {LINKS.map((l) => {
            const Icon = l.icon;
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-bg hover:text-text"
                }`}
              >
                <Icon size={14} />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-primary"
        >
          <ArrowLeft size={14} />
          Exit admin
        </Link>
      </div>
    </div>
  );
}
