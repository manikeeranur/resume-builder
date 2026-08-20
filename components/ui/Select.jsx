"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

// A shadcn-style Select (rounded trigger + floating listbox with a check
// mark on the active item), built locally like RippleButton since the app
// has no Radix/shadcn dependency to reuse.
//
// The listbox renders through a portal into document.body, positioned via
// the trigger's own bounding rect — not just `absolute` inside this
// component's own DOM position — so it isn't clipped by an ancestor with
// `overflow-hidden` (e.g. a table's rounded-corner wrapper). See
// components/admin/templates/TemplatesTable.jsx for the case that exposed
// this: the last row's dropdown was being cut off by the table container.
export default function Select({ value, onChange, options, className = "", getOptionStyle }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];

  const GAP = 6;
  const MAX_MENU_HEIGHT = 256; // matches max-h-64 below

  const reposition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // Open upward when there isn't room below for a full-height menu but
    // there's more room above — otherwise a trigger near the bottom of the
    // viewport (e.g. the last row of a tall table) opens a menu that runs
    // off-screen instead of flipping to stay visible.
    const openUpward = spaceBelow < MAX_MENU_HEIGHT && spaceAbove > spaceBelow;
    setCoords(
      openUpward
        ? { bottom: window.innerHeight - rect.top + GAP, left: rect.left, width: rect.width, openUpward: true }
        : { top: rect.bottom + GAP, left: rect.left, width: rect.width, openUpward: false }
    );
  };

  const toggleOpen = () => {
    if (!open) reposition();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const isInside = (target) => triggerRef.current?.contains(target) || menuRef.current?.contains(target);
    const onDocClick = (e) => {
      if (!isInside(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    // capture: true so this also catches scroll on an ancestor scroll
    // container (e.g. the table's own overflow-x-auto wrapper), not just
    // window-level scroll.
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

  return (
    <div ref={triggerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggleOpen}
        // Focusing this button on click makes the browser auto-scroll it
        // into view when it sits inside a scrollable ancestor (the table's
        // own overflow-x-auto wrapper) — jarring for something that's
        // already fully visible. Blocking the default mousedown focus
        // avoids that scroll jump; the click still opens the menu, and Tab
        // (a separate keydown-driven focus, unaffected by this) still works.
        onMouseDown={(e) => e.preventDefault()}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm text-text shadow-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none"
      >
        <span className="truncate" style={selected && getOptionStyle?.(selected)}>
          {selected?.label}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-text-secondary transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              left: coords.left,
              width: coords.width,
              ...(coords.openUpward ? { bottom: coords.bottom } : { top: coords.top }),
            }}
            className="z-50 max-h-64 min-w-[170px] overflow-y-auto rounded-xl border border-border bg-white p-1 shadow-card-lg"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isSelected ? "bg-primary-light font-medium text-primary" : "text-text hover:bg-bg"
                  }`}
                >
                  <span className="truncate" style={getOptionStyle?.(opt)}>
                    {opt.label}
                  </span>
                  {isSelected && <Check size={15} className="shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
