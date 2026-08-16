"use client";

import { motion } from "framer-motion";

// Purely decorative background layer for the hero — soft blurred gradient
// blobs, a dot-grid, and a slow-rotating blob outline, all in the app's own
// primary color so it reads as "on-brand texture" rather than generic clip
// art. aria-hidden throughout since none of it carries information.
export default function HeroVectors() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 left-1/2 h-[440px] w-[440px] -translate-x-[70%] rounded-full bg-primary/15 blur-3xl sm:-translate-x-1/2" />
      <div className="absolute top-10 right-0 h-[320px] w-[320px] translate-x-1/3 rounded-full bg-[#8a7cf0]/15 blur-3xl" />

      <svg className="absolute -left-6 bottom-6 h-40 w-40 text-primary/25 sm:h-52 sm:w-52" viewBox="0 0 200 200" fill="none">
        <pattern id="hero-dot-grid" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="2" fill="currentColor" />
        </pattern>
        <rect width="200" height="200" fill="url(#hero-dot-grid)" />
      </svg>

      <motion.svg
        className="absolute right-4 top-4 h-24 w-24 text-primary/20 sm:h-32 sm:w-32"
        viewBox="0 0 200 200"
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        <path
          d="M45.3,-58.5C58.2,-49.6,67.7,-34.5,71.6,-17.9C75.5,-1.3,73.8,16.8,65.6,31.2C57.4,45.6,42.7,56.2,26.5,63.1C10.3,70,-7.4,73.2,-23.5,68.8C-39.6,64.4,-54.1,52.4,-63.1,37.3C-72.1,22.2,-75.6,4,-71.9,-12.1C-68.2,-28.2,-57.3,-42.2,-43.7,-51C-30.1,-59.8,-15.1,-63.4,1.2,-65.1C17.5,-66.8,35,-67.4,45.3,-58.5Z"
          transform="translate(100 100)"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </motion.svg>
    </div>
  );
}
