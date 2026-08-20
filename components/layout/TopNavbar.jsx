"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Crown } from "lucide-react";
import AvatarMenu from "./AvatarMenu";
import NotificationBell from "./NotificationBell";

export default function TopNavbar({ user, avatarUrl, isPremium, googleEnabled }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/templates?q=${encodeURIComponent(q)}` : "/templates");
  };

  return (
    <div className="sticky top-0 z-10 hidden items-center gap-4 border-b border-border bg-white/95 px-6 py-3 backdrop-blur-md lg:flex">
      <form onSubmit={handleSearch} className="relative w-full max-w-md">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates..."
          aria-label="Search templates"
          className="w-full rounded-full border border-border bg-bg py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-secondary focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        {user && !isPremium && (
          <Link
            href="/pricing"
            className="hidden items-center gap-1.5 rounded-full bg-primary-light px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 lg:flex"
          >
            <Crown size={15} />
            Upgrade to Premium
          </Link>
        )}
        <NotificationBell />
        <AvatarMenu user={user} avatarUrl={avatarUrl} isPremium={isPremium} googleEnabled={googleEnabled} showGreeting />
      </div>
    </div>
  );
}
