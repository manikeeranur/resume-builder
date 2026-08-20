import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// backHref navigates to a fixed URL (e.g. Editor -> always back to
// dashboard); onBack instead does real browser-history back, for pages
// reachable from more than one place (e.g. Preview, opened from the
// dashboard, the resumes list, or elsewhere) where a fixed destination
// would be wrong. Pass exactly one.
export default function TopBar({ backHref, onBack, title, subtitle, children, size = "sm" }) {
  const titleClass = size === "lg" ? "text-xl sm:text-2xl" : "text-sm sm:text-base";
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>
        ) : (
          backHref && (
            <Link
              href={backHref}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
              aria-label="Back"
            >
              <ArrowLeft size={16} />
            </Link>
          )
        )}
        <div className="min-w-0">
          <h1 className={`m-0 truncate font-bold leading-tight text-text ${titleClass}`}>{title}</h1>
          {subtitle && <p className="m-0 hidden text-xs leading-4 text-text-secondary sm:block">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
