"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Pencil } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import SectionForm from "./SectionForm";
import ThemeModal from "./ThemeModal";
import ExactFirstPagePreview from "./LazyExactFirstPagePreview";
import { SECTION_LIST } from "@/lib/resumeDefaults";
import { SECTION_ICONS } from "@/lib/sectionIcons";
import { profileCompleteness } from "@/lib/profileCompleteness";
import { getTemplate } from "@/lib/templates";

export default function ResumeEditor({ resume: initialResume }) {
  const [resume, setResume] = useState(initialResume);
  const [activeSection, setActiveSection] = useState("personalInfo");
  const [status, setStatus] = useState("saved");
  const [editingTitle, setEditingTitle] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [pdfVersion, setPdfVersion] = useState(0);
  const saveTimer = useRef(null);
  const isFirstRender = useRef(true);

  const updateSection = useCallback((key, value) => {
    setResume((prev) => ({ ...prev, sections: { ...prev.sections, [key]: value } }));
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setStatus("saving");
      try {
        const res = await fetch(`/api/resumes/${resume._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections: resume.sections, title: resume.title }),
        });
        setStatus(res.ok ? "saved" : "unsaved");
        if (res.ok) setPdfVersion((v) => v + 1);
      } catch {
        setStatus("unsaved");
      }
    }, 1200);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume.sections, resume.title]);

  const statusLabel = { saved: "All changes saved", saving: "Saving…", unsaved: "Unsaved changes" }[status];
  const pi = resume.sections.personalInfo || {};
  const initials = (pi.fullName || resume.title || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const completeness = useMemo(() => profileCompleteness(resume.sections), [resume.sections]);
  const templateName = getTemplate(resume.templateId).name;

  return (
    <>
      <TopBar backHref="/dashboard" title={resume.title} subtitle={statusLabel}>
        <button
          type="button"
          onClick={() => setThemeModalOpen(true)}
          className="btn-secondary px-3 py-2 text-xs sm:px-4 sm:text-sm"
        >
          Theme
        </button>
        <Link href={`/resumes/${resume._id}/preview`} className="btn-primary px-3 py-2 text-xs sm:px-4 sm:text-sm">
          Preview
        </Link>
      </TopBar>

      {themeModalOpen && (
        <ThemeModal
          resume={resume}
          onClose={() => setThemeModalOpen(false)}
          onSaved={(themeConfig) => {
            setResume((prev) => ({ ...prev, themeConfig }));
            setPdfVersion((v) => v + 1);
          }}
        />
      )}

      <div className="mx-auto max-w-[1300px] px-4 pt-6 sm:px-6">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#8a7cf0] p-6 text-white shadow-card-lg sm:p-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-white/15 text-2xl font-bold sm:h-24 sm:w-24">
              {pi.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pi.photo} alt={pi.fullName} className="h-full w-full object-cover" />
              ) : (
                initials || "?"
              )}
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              {editingTitle ? (
                <input
                  autoFocus
                  value={resume.title}
                  onChange={(e) => setResume((prev) => ({ ...prev, title: e.target.value }))}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                  className="w-full max-w-sm rounded-lg border border-white/40 bg-white/10 px-2 py-1 text-xl font-bold text-white placeholder-white/60 outline-none sm:text-2xl"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingTitle(true)}
                  className="group inline-flex items-center gap-2 text-xl font-bold sm:text-2xl"
                >
                  <span className="truncate">{resume.title}</span>
                  <Pencil size={15} className="shrink-0 text-white/60 group-hover:text-white" />
                </button>
              )}
              <p className="text-sm text-white/80">
                {templateName} · Updated {new Date(resume.updatedAt || Date.now()).toLocaleDateString()}
              </p>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-white/85">
                  <span>Resume completeness</span>
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
            <SectionForm sections={resume.sections} activeSection={activeSection} updateSection={updateSection} />
          </div>
        </div>

        <div className="hidden w-[340px] shrink-0 lg:block">
          <div className="sticky top-20">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Preview</p>
            <ExactFirstPagePreview key={pdfVersion} resumeId={resume._id} />
            <p className="mt-2 text-[11px] leading-snug text-text-secondary">
              Shows the exact first page of your saved resume. Updates a moment after you stop typing.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
