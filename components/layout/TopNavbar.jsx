import { Search, Bell } from "lucide-react";
import AvatarMenu from "./AvatarMenu";

export default function TopNavbar({ user, avatarUrl }) {
  return (
    <div className="sticky top-0 z-10 hidden items-center gap-4 border-b border-border bg-white/95 px-6 py-3 backdrop-blur-md md:flex">
      <div className="relative max-w-sm flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input type="search" placeholder="Search resumes…" className="input-field w-full pl-9" />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-primary hover:text-primary"
        >
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        <AvatarMenu user={user} avatarUrl={avatarUrl} />
      </div>
    </div>
  );
}
