"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { THEME_COLORS, THEME_FONTS } from "@/lib/resumeDefaults";
import ScaledPreview from "./ScaledPreview";

export default function ThemeModal({ resume, onClose, onSaved }) {
  const [themeConfig, setThemeConfig] = useState(resume.themeConfig);
  const [status, setStatus] = useState("idle");

  const update = (key, value) => setThemeConfig((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setStatus("saving");
    try {
      const res = await fetch(`/api/resumes/${resume._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeConfig }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaved(themeConfig);
      onClose();
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-card-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-bold text-text">Theme Customization</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-semibold text-text">Primary Color</p>
              <div className="flex gap-2">
                {THEME_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => update("primaryColor", c.value)}
                    className="h-9 w-9 rounded-full ring-offset-2 transition-transform hover:scale-110"
                    style={{
                      background: c.value,
                      boxShadow: themeConfig.primaryColor === c.value ? `0 0 0 2px #fff, 0 0 0 4px ${c.value}` : "none",
                    }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-text">Font</p>
              <select
                className="input-field max-w-xs"
                value={themeConfig.font}
                onChange={(e) => update("font", e.target.value)}
              >
                {THEME_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-text">Layout</p>
              <div className="flex gap-3">
                {[
                  { value: "single", label: "Single Column" },
                  { value: "two-column", label: "Two Column" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("layout", opt.value)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                      themeConfig.layout === opt.value
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border text-text-secondary"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-text">Spacing</p>
              <div className="flex gap-3">
                {["compact", "comfortable", "spacious"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update("spacing", opt)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium capitalize ${
                      themeConfig.spacing === opt
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border text-text-secondary"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Preview</p>
            <ScaledPreview resume={{ ...resume, themeConfig }} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          {status === "error" && <span className="text-sm text-red-600">Failed to save</span>}
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={status === "saving"}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            {status === "saving" ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
