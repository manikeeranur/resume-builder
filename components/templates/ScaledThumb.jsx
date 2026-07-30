"use client";

import { useEffect, useRef, useState } from "react";
import ResumeDocument from "./ResumeDocument";

const BASE_WIDTH = 850;

export default function ScaledThumb({ resume }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.35);

  useEffect(() => {
    const recalc = () => {
      if (!containerRef.current) return;
      setScale(containerRef.current.offsetWidth / BASE_WIDTH);
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden bg-white">
      <div style={{ width: BASE_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <ResumeDocument resume={resume} />
      </div>
    </div>
  );
}
