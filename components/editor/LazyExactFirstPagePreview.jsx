"use client";

import dynamic from "next/dynamic";

// pdf.js touches browser-only APIs (e.g. DOMMatrix) that don't exist during
// Next.js's server render, so this must never be rendered on the server.
// Shared by every caller that needs the exact-first-page preview (Theme
// modal, editor Live Preview, dashboard resume cards) so the ssr:false +
// loading-skeleton wiring only lives in one place.
export default dynamic(() => import("./ExactFirstPagePreview"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[210/297] w-full items-center justify-center rounded-lg border border-border bg-bg">
      <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-text-secondary shadow-card-lg">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        Generating preview…
      </span>
    </div>
  ),
});
