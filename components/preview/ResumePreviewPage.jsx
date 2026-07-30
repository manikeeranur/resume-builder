"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ResumeDocument from "@/components/templates/ResumeDocument";

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
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);

  // Mobile only: scale the fixed-width resume to fit the screen, no horizontal scroll.
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
        const naturalWidth = 850;
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
  }, [resume]);

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

  return (
    <>
      <div className="border-b border-border bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={`/resumes/${resume._id}/edit`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:border-primary hover:text-primary"
            >
              ←
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-text sm:text-base">Resume Preview</h1>
              <p className="hidden text-xs text-text-secondary sm:block">Review your resume or save a copy</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handleDownload("pdf")}
              disabled={downloading !== null}
              className="btn-primary px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
            >
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
              className="btn-secondary px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
            >
              {downloading === "docx" ? "…" : "DOCX"}
            </button>
            <button
              type="button"
              onClick={() => handleDownload("png")}
              disabled={downloading !== null}
              className="btn-secondary px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
            >
              {downloading === "png" ? "…" : "PNG"}
            </button>
          </div>
        </div>
      </div>

      <div ref={wrapperRef} className="overflow-hidden py-8">
        <div ref={containerRef}>
          <ResumeDocument resume={resume} />
        </div>
      </div>
    </>
  );
}
