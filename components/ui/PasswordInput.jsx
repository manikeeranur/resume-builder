"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Same input-field styling every password field in the app already uses,
// plus a show/hide toggle — shared so the three password fields (login,
// signup, the standalone LoginForm) stay in sync instead of drifting.
export default function PasswordInput({ className = "", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`input-field pr-10 ${className}`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-text-secondary hover:text-text"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
