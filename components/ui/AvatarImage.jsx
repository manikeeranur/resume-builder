"use client";

import { useState } from "react";

// Renders nothing once the image fails to load (revoked OAuth token,
// ad-blocker, flaky network, etc.) instead of showing the browser's broken-
// image icon / alt text. Callers render this absolutely positioned over an
// always-present initials fallback, so a failed load just reveals it.
export default function AvatarImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}
