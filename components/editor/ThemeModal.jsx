"use client";

import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { defaultThemeConfig, THEME_COLORS, THEME_FONTS } from "@/lib/resumeDefaults";
import { getTemplate } from "@/lib/templates";
import { isLocalDraftId, saveLocalDraft } from "@/lib/localResume";
import ExactFirstPagePreview from "./LazyExactFirstPagePreview";
import Select from "@/components/ui/Select";

const FONT_OPTIONS = THEME_FONTS.map((f) => ({ value: f, label: f }));

export default function ThemeModal({ resume, onClose, onSaved, isLocal }) {
  const [themeConfig, setThemeConfig] = useState(resume.themeConfig);
  const [status, setStatus] = useState("idle");
  const local = isLocal ?? isLocalDraftId(resume._id);

  const update = (key, value) => setThemeConfig((prev) => ({ ...prev, [key]: value }));

  // The template's own reference color if it has one (e.g. Template 3/4's
  // color scheme), otherwise the app-wide default — same value a brand new
  // resume on this template would start with.
  const defaultConfig = {
    ...defaultThemeConfig,
    primaryColor: getTemplate(resume.templateId).defaultColor || defaultThemeConfig.primaryColor,
  };
  const resetToDefault = () => setThemeConfig(defaultConfig);

  const save = async () => {
    setStatus("saving");
    if (local) {
      saveLocalDraft({ ...resume, themeConfig });
      onSaved(themeConfig);
      onClose();
      return;
    }
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
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-text">Primary Color</p>
                <button
                  type="button"
                  onClick={resetToDefault}
                  className="flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text"
                >
                  <RotateCcw size={12} />
                  Reset to default
                </button>
              </div>
              <div className="grid grid-cols-6 gap-3">
                {THEME_COLORS.map((c) => {
                  const selected = themeConfig.primaryColor === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => update("primaryColor", c.value)}
                      className="relative flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c.value,
                        boxShadow: selected ? `0 0 0 2px #fff, 0 0 0 4px ${c.value}` : "none",
                      }}
                      aria-label={c.name}
                      title={c.name}
                    >
                      {selected && <Check size={16} strokeWidth={3} className="text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-text">Font</p>
              <Select
                className="max-w-xs"
                value={themeConfig.font}
                onChange={(font) => update("font", font)}
                options={FONT_OPTIONS}
                getOptionStyle={(opt) => ({ fontFamily: `"${opt.value}"` })}
              />
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
            {local ? (
              <div className="relative flex aspect-[210/297] items-center justify-center overflow-hidden rounded-lg border border-border bg-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getTemplate(resume.templateId).thumbnail}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-top opacity-25"
                />
                <span className="relative px-6 text-center text-xs font-semibold text-text-secondary">
                  Sign in to see the exact PDF preview
                </span>
              </div>
            ) : (
              <ExactFirstPagePreview resume={resume} />
            )}
            <p className="mt-2 text-[11px] leading-snug text-text-secondary">
              {local
                ? "Colors and layout still apply to your draft — the exact PDF preview needs you signed in."
                : "Shows your saved resume's exact first page. Save changes to update it."}
            </p>
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
