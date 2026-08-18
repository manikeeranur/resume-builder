"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// A shadcn-style Select (rounded trigger + floating listbox with a check
// mark on the active item), built locally like RippleButton since the app
// has no Radix/shadcn dependency to reuse.
export default function Select({ value, onChange, options, className = "", getOptionStyle }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1.5 max-h-64 w-full min-w-[170px] overflow-y-auto rounded-xl border border-border bg-white p-1 shadow-card-lg"
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
        </div>
      )}
    </div>
  );
}
