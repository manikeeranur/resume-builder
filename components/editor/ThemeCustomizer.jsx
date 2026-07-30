"use client";

import { useState } from "react";
import { THEME_COLORS, THEME_FONTS } from "@/lib/resumeDefaults";
import ScaledPreview from "./ScaledPreview";

export default function ThemeCustomizer({ resume: initialResume }) {
  const [themeConfig, setThemeConfig] = useState(initialResume.themeConfig);
  const [status, setStatus] = useState("idle");

  const update = (key, value) => setThemeConfig((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setStatus("saving");
    try {
      const res = await fetch(`/api/resumes/${initialResume._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeConfig }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  };

  const previewResume = { ...initialResume, themeConfig };

  return (
    <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px]">
      <div className="card space-y-6 p-6">
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
          <select className="input-field max-w-xs" value={themeConfig.font} onChange={(e) => update("font", e.target.value)}>
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

        <div className="flex items-center gap-3 pt-2">
          <button type="button" onClick={save} disabled={status === "saving"} className="btn-primary px-5 py-2.5 text-sm">
            {status === "saving" ? "Saving…" : "Save Changes"}
          </button>
          {status === "saved" && <span className="text-sm text-success">Saved</span>}
          {status === "error" && <span className="text-sm text-red-600">Failed to save</span>}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Preview</p>
        <ScaledPreview resume={previewResume} />
      </div>
    </div>
  );
}
