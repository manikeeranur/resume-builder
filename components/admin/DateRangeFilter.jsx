"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/components/ui/calendar";

// Same portal + reposition + outside-click pattern as components/ui/Select.jsx
// — reused rather than pulling in a Popover/Radix dependency just for this.
export default function DateRangeFilter({ from, to, onChange, placeholder = "Date range" }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [draft, setDraft] = useState({ from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  // Keep the draft in sync if the parent's filters get reset elsewhere
  // (e.g. a "clear all filters" action outside this component).
  useEffect(() => {
    setDraft({ from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined });
  }, [from, to]);

  const reposition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 6, left: rect.left });
  };

  const toggleOpen = () => {
    if (!open) reposition();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const isInside = (target) => triggerRef.current?.contains(target) || panelRef.current?.contains(target);
    const onDocClick = (e) => {
      if (!isInside(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The two-month calendar is wide (~600px) — anchoring purely by the
  // trigger's left edge runs it off the right side of the viewport for any
  // trigger past roughly the halfway point of a normal screen. Correct once
  // the panel has actually rendered (and we know its real width) rather
  // than guessing a width up front.
  useLayoutEffect(() => {
    if (!open || !coords || !panelRef.current) return;
    const margin = 8;
    const rect = panelRef.current.getBoundingClientRect();
    const overflowRight = rect.right - (window.innerWidth - margin);
    if (overflowRight > 0.5) {
      setCoords((c) => ({ ...c, left: Math.max(margin, c.left - overflowRight) }));
    }
  }, [open, coords]);

  const label = draft.from
    ? draft.to
      ? `${format(draft.from, "dd/MM/yyyy")} – ${format(draft.to, "dd/MM/yyyy")}`
      : format(draft.from, "dd/MM/yyyy")
    : placeholder;

  const apply = () => {
    onChange({
      from: draft.from ? format(draft.from, "yyyy-MM-dd") : "",
      to: draft.to ? format(draft.to, "yyyy-MM-dd") : "",
    });
    setOpen(false);
  };

  const clear = () => {
    setDraft({ from: undefined, to: undefined });
    onChange({ from: "", to: "" });
    setOpen(false);
  };

  return (
    <div ref={triggerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        onMouseDown={(e) => e.preventDefault()}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="input-field flex w-full items-center gap-2 text-left text-sm"
      >
        <CalendarIcon size={15} className="shrink-0 text-text-secondary" />
        <span className={`truncate ${draft.from ? "text-text" : "text-text-secondary"}`}>{label}</span>
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: coords.top, left: coords.left }}
            className="z-50 rounded-xl border border-border bg-white shadow-card-lg"
          >
            <Calendar
              mode="range"
              numberOfMonths={2}
              defaultMonth={draft.from}
              selected={draft}
              onSelect={(range) => setDraft(range || { from: undefined, to: undefined })}
            />
            <div className="flex items-center justify-end gap-2 border-t border-border p-3">
              <button type="button" onClick={clear} className="btn-secondary px-3 py-1.5 text-xs">
                Clear
              </button>
              <button type="button" onClick={apply} className="btn-primary px-3 py-1.5 text-xs">
                Apply
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
