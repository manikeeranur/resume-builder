"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Pencil } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import SectionForm from "./SectionForm";
import ThemeModal from "./ThemeModal";
import dynamic from "next/dynamic";

// pdf.js needs browser-only APIs, so the editor preview is client-only.
const EditorPdfPreview = dynamic(() => import("./EditorPdfPreview"), {
  ssr: false,
  loading: () => <div className="h-[calc(100vh-9rem)] rounded-lg border border-border bg-bg" />,
});
import LoginModal from "@/components/auth/LoginModal";
import { SECTION_LIST } from "@/lib/resumeDefaults";
import { SECTION_ICONS } from "@/lib/sectionIcons";
import { profileCompleteness } from "@/lib/profileCompleteness";
import { getTemplate } from "@/lib/templates";
import { isLocalDraftId, loadLocalDraft, saveLocalDraft, setPendingPromotion } from "@/lib/localResume";

// `resume` is null and `localId` is set for an anonymous visitor's
// browser-local draft (see TemplateGalleryGrid + lib/localResume.js) — in
// that case the actual draft is loaded from localStorage once mounted,
// since a server component can't read it. Everything else about the
// editor behaves the same either way; only autosave (localStorage vs. a
// PATCH) and the Preview action (straight through vs. a login prompt)
// branch on whether this is a local draft.
export default function ResumeEditor({ resume: initialResume, localId, googleEnabled }) {
  const [resume, setResume] = useState(initialResume);
  const [activeSection, setActiveSection] = useState("personalInfo");
  const [status, setStatus] = useState("saved");
  const [editingTitle, setEditingTitle] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pdfVersion, setPdfVersion] = useState(0);
  const saveTimer = useRef(null);
  const isFirstRender = useRef(true);
  const isLocal = isLocalDraftId(resume?._id);

  const [localDraftMissing, setLocalDraftMissing] = useState(false);

  useEffect(() => {
    if (!localId || initialResume) return;
    const draft = loadLocalDraft(localId);
    if (draft) setResume(draft);
    else setLocalDraftMissing(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localId]);

  const updateSection = useCallback((key, value) => {
    setResume((prev) => ({ ...prev, sections: { ...prev.sections, [key]: value } }));
  }, []);

  useEffect(() => {
    if (!resume) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setStatus("saving");
      if (isLocalDraftId(resume._id)) {
        saveLocalDraft(resume);
        setStatus("saved");
        setPdfVersion((v) => v + 1);
        return;
      }
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
  }, [resume?.sections, resume?.title]);

  const handlePreviewClick = (e) => {
    if (!isLocal) return; // real resume — let the Link navigate normally
    e.preventDefault();
    setPendingPromotion(resume._id, "preview");
    setLoginModalOpen(true);
  };

  // useMemo must run on every render regardless of whether `resume` is
  // loaded yet, so this sits above the early return below.
  const completeness = useMemo(() => profileCompleteness(resume?.sections || {}), [resume?.sections]);

  if (localDraftMissing) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center text-sm text-text-secondary">
        <p>
          This draft isn&apos;t available in this browser — local drafts aren&apos;t saved to your account until you
          sign in.
        </p>
        <Link href="/templates" className="btn-primary px-4 py-2 text-sm">
          Choose a template
        </Link>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-text-secondary">Loading your draft…</div>
    );
  }

  const statusLabel = { saved: "All changes saved", saving: "Saving…", unsaved: "Unsaved changes" }[status];
  const templateName = getTemplate(resume.templateId).name;

  return (
    // Large screens: the editor fills exactly the screen below the shell's
    // 67px TopNavbar — no page scroll.
    // Only the left column (sections + form) scrolls; the preview stays put.
    <div className="lg:flex lg:h-[calc(100vh-67px)] lg:flex-col">
      <TopBar
        backHref={isLocal ? "/templates" : "/dashboard"}
        title={
          editingTitle ? (
            <input
              autoFocus
              value={resume.title}
              onChange={(e) => setResume((prev) => ({ ...prev, title: e.target.value }))}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              aria-label="Resume title"
              className="w-full max-w-xs rounded-md border border-border px-2 py-0.5 text-base font-bold text-text outline-none focus:border-primary"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              title="Rename resume"
              className="group inline-flex max-w-full items-center gap-1.5"
            >
              <span className="truncate">{resume.title}</span>
              <Pencil size={13} className="shrink-0 text-text-secondary group-hover:text-primary" />
            </button>
          )
        }
        subtitle={`${templateName} · ${statusLabel}`}
      >
        <button
          type="button"
          onClick={() => setThemeModalOpen(true)}
          className="btn-secondary px-3 py-2 text-xs sm:px-4 sm:text-sm"
        >
          Theme
        </button>
        <Link
          href={`/resumes/${resume._id}/preview`}
          onClick={handlePreviewClick}
          className="btn-primary px-3 py-2 text-xs sm:px-4 sm:text-sm"
        >
          Preview
        </Link>
      </TopBar>

      {themeModalOpen && (
        <ThemeModal
          resume={resume}
          isLocal={isLocal}
          onClose={() => setThemeModalOpen(false)}
          onSaved={(themeConfig) => {
            setResume((prev) => ({ ...prev, themeConfig }));
            setPdfVersion((v) => v + 1);
          }}
        />
      )}

      {loginModalOpen && (
        <LoginModal googleEnabled={googleEnabled} onClose={() => setLoginModalOpen(false)} onSuccess={() => setLoginModalOpen(false)} />
      )}

      {/* Two columns: left = sections/form (scrolls), right = preview (fixed). */}
      <div className="flex w-full gap-6 px-4 py-6 sm:px-6 lg:min-h-0 lg:flex-1">
      <div className="min-w-0 flex-1 lg:overflow-y-auto lg:pr-1">
      <div className="flex w-full flex-col gap-6 md:flex-row">
        <nav className="md:w-56 md:shrink-0">
          <div className="card mb-3 px-3 py-2.5">
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-text-secondary">
              <span>Completeness</span>
              <span className="text-primary">{completeness.percent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${completeness.percent}%` }} />
            </div>
          </div>
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
              sections={resume.sections}
              activeSection={activeSection}
              updateSection={updateSection}
              userId={resume.userId}
            />
          </div>
        </div>
      </div>
      </div>

        <div className="hidden shrink-0 lg:block">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Preview</p>
            {isLocal ? (
              <div className="relative flex aspect-[210/297] w-[340px] items-center justify-center overflow-hidden rounded-lg border border-border bg-bg">
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
              <EditorPdfPreview version={pdfVersion} resume={resume} />
            )}
            {/* w-0 min-w-full: the caption wraps to the page width instead of widening the column. */}
            <p className="mt-2 w-0 min-w-full text-[11px] leading-snug text-text-secondary">
              {isLocal
                ? "This exact preview needs your resume saved to an account — click Preview above to sign in."
                : "Exactly as your PDF will look. Use Prev / Next for more pages; updates a moment after you stop typing."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
