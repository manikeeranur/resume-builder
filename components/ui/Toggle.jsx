"use client";

// Matches the "Show photo on resume" switch in
// components/editor/PersonalInfoForm.jsx exactly, so every toggle in the
// app looks and behaves the same — a real button[role=switch] rather than
// a disguised checkbox, so it's keyboard/screen-reader operable natively.
export default function Toggle({ checked, onChange, label }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-text">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          checked ? "bg-primary" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
