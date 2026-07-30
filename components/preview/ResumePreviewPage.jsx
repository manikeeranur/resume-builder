"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { IconFileTypePdf, IconFileTypeDoc, IconPhoto } from "@tabler/icons-react";
import ResumeDocument from "@/components/templates/ResumeDocument";
import { PDF_PAGE_HEIGHT_PX } from "@/components/templates/helpers";

const PAGE_WIDTH_PX = 850;
const THUMB_WIDTH_PX = 92;
const THUMB_SCALE = THUMB_WIDTH_PX / PAGE_WIDTH_PX;
const THUMB_HEIGHT_PX = Math.round(PDF_PAGE_HEIGHT_PX * THUMB_SCALE);

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

export default function ResumePreviewPage({ resume }) {
  const [downloading, setDownloading] = useState(null);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const measureRef = useRef(null);
  const pageRefs = useRef([]);

  // Mobile only: scale the fixed-width page stack to fit the screen, no horizontal scroll.
  useEffect(() => {
    const scale = () => {
      const container = containerRef.current;
      const wrapper = wrapperRef.current;
      if (!container || !wrapper) return;
      const vw = window.innerWidth;

      if (vw < 900) {
        container.style.transform = "";
        container.style.marginLeft = "";
        wrapper.style.height = "";
        const naturalWidth = PAGE_WIDTH_PX;
        const naturalHeight = container.offsetHeight;
        const factor = vw / naturalWidth;
        container.style.transform = `scale(${factor})`;
        container.style.transformOrigin = "top left";
        wrapper.style.height = `${naturalHeight * factor}px`;
      } else {
        container.style.transform = "";
        wrapper.style.height = "";
      }
    };
    const timer = setTimeout(scale, 60);
    window.addEventListener("resize", scale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", scale);
    };
  }, [resume, pageCount]);

  // Estimate how many A4 pages the PDF export will produce, so page breaks
  // are visible before downloading. Every page-sheet below renders the full
  // resume internally (just clipped + shifted), so measuring any one of
  // them gives the true unclipped content height.
  useEffect(() => {
    const measure = () => {
      if (!measureRef.current) return;
      const height = measureRef.current.scrollHeight;
      const next = Math.max(1, Math.ceil(height / PDF_PAGE_HEIGHT_PX));
      setPageCount((prev) => (prev === next ? prev : next));
    };
    const timer = setTimeout(measure, 80);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [resume, pageCount]);

  const handleDownload = async (format) => {
    setDownloading(format);
    try {
      const ext = format;
      const filename = `${(resume.title || "Resume").replace(/[^a-z0-9]+/gi, "_")}.${ext}`;
      await downloadFile(`/api/resumes/${resume._id}/${format}`, filename);
    } catch (err) {
      alert(`Failed to download ${format.toUpperCase()}. Please try again.`);
    } finally {
      setDownloading(null);
    }
  };

  const jumpToPage = (i) => {
    setActivePage(i);
    pageRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className="border-b border-border bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={`/resumes/${resume._id}/edit`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:border-primary hover:text-primary"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-bold text-text sm:text-base">Resume Preview</h1>
                <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                  {pageCount} page{pageCount > 1 ? "s" : ""}
                </span>
              </div>
              <p className="hidden text-xs text-text-secondary sm:block">Review your resume or save a copy</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handleDownload("pdf")}
              disabled={downloading !== null}
              className="btn-primary flex items-center gap-1.5 px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
            >
              <IconFileTypePdf size={16} stroke={1.75} />
              {downloading === "pdf" ? "…" : (
                <>
                  <span className="hidden sm:inline">Download </span>PDF
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleDownload("docx")}
              disabled={downloading !== null}
              className="btn-secondary flex items-center gap-1.5 px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
            >
              <IconFileTypeDoc size={16} stroke={1.75} />
              {downloading === "docx" ? "…" : "DOCX"}
            </button>
            <button
              type="button"
              onClick={() => handleDownload("png")}
              disabled={downloading !== null}
              className="btn-secondary flex items-center gap-1.5 px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
            >
              <IconPhoto size={16} stroke={1.75} />
              {downloading === "png" ? "…" : "PNG"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-start">
        {/* Page thumbnail rail — large screens only, stays pinned while the main view scrolls */}
        {pageCount > 1 && (
          <div className="sticky top-0 hidden h-screen w-28 shrink-0 overflow-y-auto border-r border-border bg-white px-3 py-4 lg:block">
            <div className="flex flex-col items-center gap-4">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => jumpToPage(i)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`relative overflow-hidden rounded bg-white shadow transition-all ${
                      activePage === i ? "ring-2 ring-primary" : "ring-1 ring-border hover:ring-primary/50"
                    }`}
                    style={{ width: THUMB_WIDTH_PX, height: THUMB_HEIGHT_PX }}
                  >
                    <div
                      style={{
                        width: PAGE_WIDTH_PX,
                        transform: `scale(${THUMB_SCALE}) translateY(${-i * PDF_PAGE_HEIGHT_PX}px)`,
                        transformOrigin: "top left",
                      }}
                    >
                      <ResumeDocument resume={resume} />
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${activePage === i ? "text-primary" : "text-text-secondary"}`}
                  >
                    {i + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1 bg-bg">
          <div ref={wrapperRef} className="py-4">
            <div ref={containerRef}>
              <div className="flex flex-col items-center gap-4" style={{ width: PAGE_WIDTH_PX, margin: "0 auto" }}>
                {Array.from({ length: pageCount }).map((_, i) => (
                  <div key={i} ref={(el) => (pageRefs.current[i] = el)} className="flex flex-col items-center gap-1.5">
                    <div
                      className="relative overflow-hidden bg-white shadow-lg"
                      style={{ width: PAGE_WIDTH_PX, height: PDF_PAGE_HEIGHT_PX }}
                    >
                      <div
                        ref={i === 0 ? measureRef : null}
                        style={{ position: "absolute", top: -i * PDF_PAGE_HEIGHT_PX, left: 0, width: PAGE_WIDTH_PX }}
                      >
                        <ResumeDocument resume={resume} />
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-text-secondary">
                      Page {i + 1} of {pageCount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
