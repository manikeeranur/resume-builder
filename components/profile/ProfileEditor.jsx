"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  Code2,
  Eye,
  Globe,
  Link2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Sparkles,
  User,
  X,
} from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import ScaledPreview from "@/components/editor/ScaledPreview";
import SectionForm from "@/components/editor/SectionForm";
import PersonalInfoForm from "@/components/editor/PersonalInfoForm";
import PhotoUploader from "@/components/editor/PhotoUploader";
import GradientAvatar from "./GradientAvatar";
import ProfileShowcase from "./ProfileShowcase";
import { SECTION_LIST, defaultThemeConfig } from "@/lib/resumeDefaults";
import { SECTION_ICONS } from "@/lib/sectionIcons";
import { profileCompleteness } from "@/lib/profileCompleteness";

const ACCORDION_SECTIONS = SECTION_LIST.filter((s) => s.key !== "personalInfo");

const withProtocol = (url) => (url && !/^https?:\/\//i.test(url) ? `https://${url}` : url);

export default function ProfileEditor({ profile: initialProfile, isPremium }) {
  const [sections, setSections] = useState(initialProfile.sections);
  const [mode, setMode] = useState("view");
  const [status, setStatus] = useState("saved");
  const [openSection, setOpenSection] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
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

  const contactItems = [
    { icon: Phone, value: pi.phone, href: pi.phone ? `tel:${pi.phone}` : null },
    { icon: Mail, value: pi.email, href: pi.email ? `mailto:${pi.email}` : null },
    { icon: MapPin, value: pi.location, href: null },
    { icon: Link2, value: pi.linkedin, href: withProtocol(pi.linkedin) },
    { icon: Code2, value: pi.github, href: withProtocol(pi.github) },
    { icon: Globe, value: pi.portfolio, href: withProtocol(pi.portfolio) },
  ].filter((c) => c.value);

  if (mode === "view") {
    return (
      <>
        <TopBar title="Profile" subtitle="Your master profile">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:px-4 sm:text-sm"
          >
            <Pencil size={14} />
            Edit Profile
          </button>
        </TopBar>
        <ProfileShowcase sections={sections} isPremium={isPremium} />
      </>
    );
  }

  return (
    <>
      <TopBar backHref="/dashboard" title="Profile" subtitle={statusLabel}>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="btn-secondary inline-flex items-center gap-1.5 px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
        >
          <Eye size={14} />
          <span className="hidden sm:inline">Preview</span>
        </button>
        <button
          type="button"
          onClick={() => {
            saveNow(sections);
            setMode("view");
          }}
          className="btn-primary px-3 py-2 text-xs sm:px-4 sm:text-sm"
        >
          Save
        </button>
      </TopBar>

      <div className="mx-auto max-w-[880px] px-4 pt-6 sm:px-6">
        {/* Hero card */}
        <div className="animate-fade-in-up relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary-light via-white to-primary-light p-6 shadow-card-lg sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />

          <PhotoUploader
            value={pi.photo}
            name={pi.fullName}
            userId={initialProfile.userId}
            onChange={(url) => updateSection("personalInfo", { ...pi, photo: url })}
            renderTrigger={({ openFile, hasPhoto }) => (
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
                  <button
                    type="button"
                    onClick={openFile}
                    aria-label={hasPhoto ? "Change photo" : "Upload photo"}
                    className="group relative"
                  >
                    <GradientAvatar photo={pi.photo} alt={pi.fullName} initials={initials} size="md" isPremium={isPremium}>
                      <span className="absolute bottom-0.5 right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-card-lg transition-transform duration-200 group-hover:scale-110">
                        <Camera size={14} />
                      </span>
                    </GradientAvatar>
                  </button>

                  <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold text-text sm:text-2xl">
                      {pi.fullName || "Add your name"}
                    </h1>
                    <p className="truncate text-sm font-semibold text-primary">{pi.title || "Add your job title"}</p>

                    {contactItems.length > 0 ? (
                      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                        {contactItems.map(({ icon: Icon, value, href }, i) =>
                          href ? (
                            <a
                              key={i}
                              href={href}
                              target={href.startsWith("http") ? "_blank" : undefined}
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-primary sm:justify-start sm:text-sm"
                            >
                              <Icon size={14} className="shrink-0 text-primary/70" />
                              <span className="truncate">{value}</span>
                            </a>
                          ) : (
                            <span
                              key={i}
                              className="flex items-center justify-center gap-1.5 text-xs text-text-secondary sm:justify-start sm:text-sm"
                            >
                              <Icon size={14} className="shrink-0 text-primary/70" />
                              <span className="truncate">{value}</span>
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-text-secondary">Add your contact details below.</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openFile}
                  className="btn-secondary inline-flex shrink-0 items-center gap-2 self-center px-4 py-2 text-xs sm:self-start sm:text-sm"
                >
                  <Camera size={15} />
                  {hasPhoto ? "Change Photo" : "Add Photo"}
                </button>
              </div>
            )}
          />

          <div className="relative mt-6">
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={13} className="text-primary" />
                Profile completeness
              </span>
              <span className="font-semibold text-primary">{completeness.percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#8a7cf0] transition-all duration-700 ease-out"
                style={{ width: `${completeness.percent}%` }}
              />
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-text-secondary">
          This is your master profile — new resumes are pre-filled from it, so you only fill this in once.
        </p>

        {/* Personal information */}
        <div className="animate-fade-in-up card mt-6 p-5 sm:p-6" style={{ animationDelay: "80ms" }}>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
              <User size={16} />
            </span>
            <h2 className="text-base font-bold text-text">Personal Information</h2>
          </div>
          <PersonalInfoForm value={pi} onChange={(v) => updateSection("personalInfo", v)} hidePhotoUploader />
        </div>

        {/* Other sections, as an accordion */}
        <div className="animate-fade-in-up card mt-6 divide-y divide-border overflow-hidden" style={{ animationDelay: "150ms" }}>
          {ACCORDION_SECTIONS.map((s) => {
            const Icon = SECTION_ICONS[s.key];
            const filled = completeness.filledKeys.has(s.key);
            const open = openSection === s.key;
            return (
              <div key={s.key}>
                <button
                  type="button"
                  onClick={() => setOpenSection(open ? null : s.key)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-bg"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                    {Icon && <Icon size={16} />}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-text">{s.label}</span>
                  {filled && <CheckCircle2 size={16} className="shrink-0 text-success" />}
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-text-secondary transition-transform duration-300 ${
                      open ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5">
                      <SectionForm
                        sections={sections}
                        activeSection={s.key}
                        updateSection={updateSection}
                        userId={initialProfile.userId}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-10" />
      </div>

      {/* Live preview drawer */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          previewOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewOpen(false)} />
        <div
          className={`absolute right-0 top-0 flex h-full w-full max-w-md transform flex-col bg-bg shadow-card-lg transition-transform duration-300 ease-out ${
            previewOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-white px-5 py-3.5">
            <h2 className="text-sm font-bold text-text">Live Preview</h2>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              aria-label="Close preview"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <ScaledPreview resume={previewResume} />
          </div>
        </div>
      </div>
    </>
  );
}
