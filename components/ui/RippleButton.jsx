"use client";

import { useState } from "react";

// A plain <button>/<Link> with a Material-style ripple burst added on click,
// implemented locally (no UI library) since the app only uses Tailwind.
export default function RippleButton({ as: Component = "button", className = "", onClick, children, ...props }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const id = Date.now() + Math.random();
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size },
    ]);
    window.setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 550);
    onClick?.(e);
  };

  return (
    <Component {...props} onClick={handleClick} className={`relative overflow-hidden ${className}`}>
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute rounded-full bg-current opacity-30 animate-ripple"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
    </Component>
  );
}
