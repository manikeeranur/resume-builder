"use client";

import { useState } from "react";
import ScaledThumb from "./ScaledThumb";
import { sampleResume } from "@/lib/sampleResume";
import { sampleResume2 } from "@/lib/sampleResume2";

const FALLBACK_SAMPLES = {
  "template-1": sampleResume,
  "template-2": sampleResume2,
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

  const fallback = FALLBACK_SAMPLES[templateId] || sampleResume;
  return <ScaledThumb resume={fallback} />;
}
