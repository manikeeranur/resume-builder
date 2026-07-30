import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TopBar({ backHref, title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="m-0 truncate text-sm font-bold leading-5 text-text sm:text-base">{title}</h1>
          {subtitle && <p className="m-0 hidden text-xs leading-4 text-text-secondary sm:block">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
