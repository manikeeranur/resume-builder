import { Eye, EyeOff } from "lucide-react";
import PhotoUploader from "./PhotoUploader";

const FIELDS = [
  { key: "fullName", label: "Full Name" },
  { key: "title", label: "Title" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "github", label: "GitHub" },
  { key: "portfolio", label: "Portfolio" },
  { key: "dateOfBirth", label: "Date of Birth", type: "date" },
];

export default function PersonalInfoForm({ value, onChange, userId }) {
  const pi = value || {};

  const update = (key, val) => onChange({ ...pi, [key]: val });

  return (
    <div className="space-y-4">
      <PhotoUploader value={pi.photo} name={pi.fullName} userId={userId} onChange={(url) => update("photo", url)} />

      {pi.photo && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-bg px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            {pi.showPhoto !== false ? <Eye size={15} /> : <EyeOff size={15} />}
            Show photo on resume
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={pi.showPhoto !== false}
            aria-label="Show photo on resume"
            onClick={() => update("showPhoto", pi.showPhoto === false)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              pi.showPhoto !== false ? "bg-primary" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                pi.showPhoto !== false ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-medium text-text-secondary">{f.label}</label>
            <input
              className="input-field"
              type={f.type || "text"}
              value={pi[f.key] || ""}
              onChange={(e) => update(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
