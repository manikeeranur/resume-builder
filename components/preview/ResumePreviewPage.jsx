"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { IconPalette, IconDownload } from "@tabler/icons-react";
import TopBar from "@/components/layout/TopBar";
import ThemeModal from "@/components/editor/ThemeModal";
import RippleButton from "@/components/ui/RippleButton";
import { downloadResumePdf } from "@/lib/downloadResumePdf";
import { useToast } from "@/components/providers/ToastProvider";

// pdf.js touches browser-only APIs (e.g. DOMMatrix) that don't exist during
// Next.js's server render, so this must never be rendered on the server.
const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => <p className="py-12 text-center text-sm text-text-secondary">Loading preview…</p>,
});

export default function ResumePreviewPage({ resume: initialResume }) {
  const router = useRouter();
  const toast = useToast();
  const [resume, setResume] = useState(initialResume);
  const [downloading, setDownloading] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [pdfVersion, setPdfVersion] = useState(0);
  const wrapperRef = useRef(null);
  const [wrapperHeight, setWrapperHeight] = useState(null);

  // This page is rendered below the dashboard shell's own sticky
  // TopNavbar, which reserves real space in normal flow above it — so a
  // flat `h-screen` here overshoots the actually-visible viewport by
  // that header's height, leaving the bottom of the page (and anything
  // pinned there, like PdfViewer's pagination bar) unreachable without an
  // extra outer-page scroll. Measuring the real gap directly is robust to
  // that header's height changing (e.g. across breakpoints) without this
  // page needing to know its size.
  useEffect(() => {
    const measure = () => {
      if (!wrapperRef.current) return;
      setWrapperHeight(window.innerHeight - wrapperRef.current.getBoundingClientRect().top);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadResumePdf(resume);
    } catch (err) {
      toast(err.message || "Failed to download PDF. Please try again.", { type: "error" });
    } finally {
      setDownloading(false);
    }
  };

  const actionButtons = (
    <>
      <RippleButton
        type="button"
        onClick={() => setThemeModalOpen(true)}
        aria-label="Theme"
        className="btn-secondary flex items-center gap-1.5 px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
        style={{ borderRadius: "9999px" }}
      >
        <IconPalette size={16} stroke={2} />
        <span className="hidden sm:inline">Theme</span>
      </RippleButton>

      <RippleButton
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        aria-label={downloading ? "Downloading…" : "Download"}
        className="btn-secondary flex items-center gap-1.5 px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
        style={{ borderRadius: "9999px" }}
      >
        <IconDownload size={16} stroke={1.75} />
        <span className="hidden sm:inline">{downloading ? "Downloading…" : "Download"}</span>
      </RippleButton>
    </>
  );

  return (
    <div ref={wrapperRef} className="flex h-screen flex-col" style={wrapperHeight ? { height: wrapperHeight } : undefined}>
      {/* Large screens: the same native TopBar the editor uses, so
          Edit ↔ Preview doesn't feel like two different apps. Small
          screens keep this page's own richer header (icon badge, pill
          buttons) below — there's less width to share there, so the
          compact shared bar isn't worth the consistency trade-off.
          Neither needs `sticky`: this component's only scrolling region
          is the PDF viewer below, so the header is already always
          visible as a plain flex item above it. Making it sticky too
          would fight the dashboard shell's own sticky TopNavbar above it
          for the same top:0 spot the moment the outer page scrolls even
          a pixel. */}
      <div className="hidden lg:block">
        <TopBar
          onBack={() => router.back()}
          title={resume.title || "Resume Preview"}
          subtitle="Review your resume before you download"
        >
          {actionButtons}
        </TopBar>
      </div>

      <div className="border-b border-border bg-white/95 shadow-sm backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
            >
              <ArrowLeft size={16} />
            </button>
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
