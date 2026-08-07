"use client";

import { useState } from "react";
import ScaledThumb from "./ScaledThumb";
import { sampleResume } from "@/lib/sampleResume";
import { sampleResume2 } from "@/lib/sampleResume2";
import { sampleResume3 } from "@/lib/sampleResume3";
import { sampleResume4 } from "@/lib/sampleResume4";
import { sampleResume5 } from "@/lib/sampleResume5";
import { sampleResume6 } from "@/lib/sampleResume6";

const FALLBACK_SAMPLES = {
  "template-1": sampleResume,
  "template-2": sampleResume2,
  "template-3": sampleResume3,
  "template-4": sampleResume4,
  "template-5": sampleResume5,
  "template-6": sampleResume6,
};

export default function TemplateThumb({ templateId, thumbnail }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (thumbnail && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumbnail}
        alt=""
        className="h-full w-full object-cover object-top"
        onError={() => setImageFailed(true)}
      />
    );
  }

  // FALLBACK_SAMPLES only covers the 6 built-ins; an admin-created template
  // id isn't in that map, so fall back to the generic sample content but
  // keep its *own* templateId — reusing sampleResume's would render
  // Template1 (its hardcoded templateId) instead of this dynamic template.
  const fallback = FALLBACK_SAMPLES[templateId] || { ...sampleResume, templateId };
  return <ScaledThumb resume={fallback} />;
}
