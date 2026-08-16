"use client";

import { motion } from "framer-motion";

// Fade-and-rise-into-view wrapper for marketing sections — the page itself
// (app/(marketing)/page.jsx) stays a Server Component for its session/plan
// data fetching, so this is the one "use client" boundary that lets those
// sections animate without turning the whole page client-side. `viewport
// once: true` means each section animates in exactly once as it's
// scrolled to, never re-triggering on scroll-back.
export default function Reveal({ children, delay = 0, y = 24, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
