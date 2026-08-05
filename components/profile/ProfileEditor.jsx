"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import ScaledPreview from "@/components/editor/ScaledPreview";
import SectionForm from "@/components/editor/SectionForm";
import { SECTION_LIST, defaultThemeConfig } from "@/lib/resumeDefaults";
import { SECTION_ICONS } from "@/lib/sectionIcons";
import { profileCompleteness } from "@/lib/profileCompleteness";
import CrownBadge from "@/components/layout/CrownBadge";
import AvatarImage from "@/components/ui/AvatarImage";

export default function ProfileEditor({ profile: initialProfile, isPremium }) {
  const [sections, setSections] = useState(initialProfile.sections);
  const [activeSection, setActiveSection] = useState("personalInfo");
  const [status, setStatus] = useState("saved");
  const saveTimer = useRef(null);
  const isFirstRender = useRef(true);

  const updateSection = useCallback((key, value) => {
    setSections((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveNow = useCallback(async (sectionsToSave) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: sectionsToSave }),
      });
      setStatus(res.ok ? "saved" : "unsaved");
    } catch {
      setStatus("unsaved");
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNow(sections), 1200);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const statusLabel = { saved: "All changes saved", saving: "Saving…", unsaved: "Unsaved changes" }[status];
  const previewResume = { templateId: "template-1", themeConfig: defaultThemeConfig, sections };

  const pi = sections.personalInfo || {};
  const initials = (pi.fullName || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const completeness = useMemo(() => profileCompleteness(sections), [sections]);

  return (
    <>
      <TopBar backHref="/dashboard" title="Profile" subtitle={statusLabel}>
        <button
          type="button"
          onClick={() => saveNow(sections)}
          disabled={status === "saving"}
          className="btn-primary px-3 py-2 text-xs sm:px-4 sm:text-sm"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
      </TopBar>

      <div className="mx-auto max-w-[1300px] px-4 pt-6 sm:px-6">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#8a7cf0] p-6 text-white shadow-card-lg sm:p-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-white/15 text-2xl font-bold">
                {initials || "?"}
                <AvatarImage src={pi.photo} alt={pi.fullName} className="absolute inset-0 h-full w-full object-cover" />
              </div>
              {/* Sibling of the overflow-hidden circle, not a child, so the
                  badge isn't clipped by its own rounded overflow. */}
              {isPremium && <CrownBadge size="lg" />}
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="truncate text-xl font-bold sm:text-2xl">{pi.fullName || "Add your name"}</p>
              <p className="truncate text-sm text-white/80">{pi.title || "Add your job title"}</p>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-white/85">
                  <span>Profile completeness</span>
                  <span>{completeness.percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${completeness.percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-3 max-w-[1300px] px-4 text-xs text-text-secondary sm:px-6">
        This is your master profile — new resumes are pre-filled from it, so you only fill this in once.
      </p>

      <div className="mx-auto flex max-w-[1300px] flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row">
        <nav className="md:w-56 md:shrink-0">
          <div className="card flex gap-1 overflow-x-auto p-2 md:block md:space-y-1 md:overflow-visible">
            {SECTION_LIST.map((s) => {
              const Icon = SECTION_ICONS[s.key];
              const filled = completeness.filledKeys.has(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActiveSection(s.key)}
                  className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors md:w-full ${
                    activeSection === s.key ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-bg"
                  }`}
                >
                  {Icon && <Icon size={16} className="shrink-0" />}
                  <span className="flex-1">{s.label}</span>
                  {filled && <CheckCircle2 size={14} className="shrink-0 text-success" />}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          <div className="card p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2.5">
              {(() => {
                const Icon = SECTION_ICONS[activeSection];
                return Icon ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <Icon size={16} />
                  </span>
                ) : null;
              })()}
              <h2 className="text-base font-bold text-text">
                {SECTION_LIST.find((s) => s.key === activeSection)?.label}
              </h2>
            </div>
            <SectionForm
              sections={sections}
              activeSection={activeSection}
              updateSection={updateSection}
              userId={initialProfile.userId}
            />
          </div>
        </div>

        <div className="hidden w-[340px] shrink-0 lg:block">
          <div className="sticky top-20">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Live Preview</p>
            <ScaledPreview resume={previewResume} />
          </div>
        </div>
      </div>
    </>
  );
}
