"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { IconPalette, IconDownload, IconFileTypePdf, IconFileTypePng } from "@tabler/icons-react";
import TopBar from "@/components/layout/TopBar";
import ThemeModal from "@/components/editor/ThemeModal";
import RippleButton from "@/components/ui/RippleButton";

const DOWNLOAD_OPTIONS = [
  { format: "pdf", label: "PDF", Icon: IconFileTypePdf },
  { format: "png", label: "PNG", Icon: IconFileTypePng },
];

// pdf.js touches browser-only APIs (e.g. DOMMatrix) that don't exist during
// Next.js's server render, so this must never be rendered on the server.
const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => <p className="py-12 text-center text-sm text-text-secondary">Loading preview…</p>,
});

async function downloadFile(url, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export default function ResumePreviewPage({ resume: initialResume }) {
  const [resume, setResume] = useState(initialResume);
  const [downloading, setDownloading] = useState(null);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [pdfVersion, setPdfVersion] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const handleDownload = async (format) => {
    setMenuOpen(false);
    setDownloading(format);
    try {
      const filename = `${(resume.title || "Resume").replace(/[^a-z0-9]+/gi, "_")}.${format}`;
      await downloadFile(`/api/resumes/${resume._id}/${format}`, filename);
    } catch (err) {
      alert(`Failed to download ${format.toUpperCase()}. Please try again.`);
    } finally {
      setDownloading(null);
    }
  };

  const actionButtons = (
    <>
      <RippleButton
        type="button"
        onClick={() => setThemeModalOpen(true)}
        className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs sm:px-4 sm:text-sm"
        style={{ borderRadius: "9999px" }}
      >
        <IconPalette size={16} stroke={2} />
        Theme
      </RippleButton>

      <div ref={menuRef} className="relative">
        <RippleButton
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          disabled={downloading !== null}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs sm:px-4 sm:text-sm"
          style={{ borderRadius: "9999px" }}
        >
          <IconDownload size={16} stroke={2} />
          Download
        </RippleButton>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-white py-1.5 shadow-card-lg"
          >
            {DOWNLOAD_OPTIONS.map(({ format, label, Icon }) => (
              <RippleButton
                key={format}
                as="button"
                type="button"
                role="menuitem"
                onClick={() => handleDownload(format)}
                disabled={downloading !== null}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-text transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon size={16} stroke={1.75} className="text-text-secondary" />
                {downloading === format ? "Downloading…" : label}
              </RippleButton>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Large screens: the same native TopBar the editor uses, so
          Edit ↔ Preview doesn't feel like two different apps. Small
          screens keep this page's own richer header (icon badge, pill
          buttons) below — there's less width to share there, so the
          compact shared bar isn't worth the consistency trade-off. */}
      <div className="sticky top-0 z-20 hidden lg:block">
        <TopBar
          backHref={`/resumes/${resume._id}/edit`}
          title={resume.title || "Resume Preview"}
          subtitle="Review your resume before you download"
        >
          {actionButtons}
        </TopBar>
      </div>

      <div className="sticky top-0 z-20 border-b border-border bg-white/95 shadow-sm backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={`/resumes/${resume._id}/edit`}
              aria-label="Back to editor"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
            >
              <ArrowLeft size={16} />
            </Link>
            <span
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex"
              style={{ background: "var(--primary-light)", color: "var(--primary)" }}
            >
              <Eye size={18} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold leading-5 text-text sm:text-base">
                {resume.title || "Resume Preview"}
              </h1>
              <p className="hidden text-xs leading-4 text-text-secondary sm:block">
                Review your resume before you download
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">{actionButtons}</div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <PdfViewer key={pdfVersion} resume={resume} />
      </div>

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
    </div>
  );
}
