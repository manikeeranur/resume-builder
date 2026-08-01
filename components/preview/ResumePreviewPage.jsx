"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { IconPalette, IconDownload } from "@tabler/icons-react";
import TopBar from "@/components/layout/TopBar";
import ThemeModal from "@/components/editor/ThemeModal";
import RippleButton from "@/components/ui/RippleButton";

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
  const [downloading, setDownloading] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [pdfVersion, setPdfVersion] = useState(0);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const filename = `${(resume.title || "Resume").replace(/[^a-z0-9]+/gi, "_")}.pdf`;
      await downloadFile(`/api/resumes/${resume._id}/pdf`, filename);
    } catch (err) {
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
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

      <RippleButton
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs sm:px-4 sm:text-sm"
        style={{ borderRadius: "9999px" }}
      >
        <IconDownload size={16} stroke={1.75} />
        {downloading ? "Downloading…" : "Download"}
      </RippleButton>
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
