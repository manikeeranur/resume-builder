"use client";

import { useEffect, useRef, useState } from "react";
import ResumeDocument from "@/components/templates/ResumeDocument";
import { PAGE_MARGIN_PX } from "@/components/templates/helpers";

const BASE_WIDTH = 962;

export default function ScaledPreview({ resume }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const recalc = () => {
      if (!containerRef.current || !contentRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const nextScale = containerWidth / BASE_WIDTH;
      setScale(nextScale);
      setHeight(contentRef.current.scrollHeight * nextScale);
    };

    const timer = setTimeout(recalc, 50);
    window.addEventListener("resize", recalc);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", recalc);
    };
  }, [resume]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-xl border border-border bg-white" style={{ height }}>
      <div
        ref={contentRef}
        style={{
          width: BASE_WIDTH,
          paddingTop: PAGE_MARGIN_PX,
          paddingBottom: PAGE_MARGIN_PX,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <ResumeDocument resume={resume} />
      </div>
    </div>
  );
}
