"use client";

import { motion } from "framer-motion";

// Two real template thumbnails, stacked and gently animated — entrance
// (rotate + fade in from either side) then a slow continuous float once
// settled, so the hero reads as alive rather than a static screenshot.
// The decorative SVG shapes behind this live separately in HeroVectors.
export default function HeroTemplateStack() {
  return (
    <div className="relative mx-auto hidden h-[380px] w-full max-w-sm sm:block">
      <motion.div
        initial={{ opacity: 0, x: 40, rotate: 16 }}
        animate={{ opacity: 1, x: 0, rotate: 6, y: [0, -10, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 0.25 },
          x: { duration: 0.6, delay: 0.25 },
          rotate: { duration: 0.6, delay: 0.25 },
          y: { duration: 5, delay: 1, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute right-0 top-6 w-56 overflow-hidden rounded-2xl border border-border bg-white shadow-card-lg"
      >
        <div className="aspect-[3/4]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/templates/template-5.png" alt="" className="h-full w-full object-cover object-top" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40, rotate: -16 }}
        animate={{ opacity: 1, x: 0, rotate: -6, y: [0, -14, 0] }}
        transition={{
          opacity: { duration: 0.6 },
          x: { duration: 0.6 },
          rotate: { duration: 0.6 },
          y: { duration: 6, delay: 0.6, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute left-0 top-0 z-10 w-56 overflow-hidden rounded-2xl border border-border bg-white shadow-card-lg"
      >
        <div className="aspect-[3/4]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/templates/template-2.png"
            alt="A ResumePro template, ready to fill in"
            className="h-full w-full object-cover object-top"
          />
        </div>
      </motion.div>
    </div>
  );
}
