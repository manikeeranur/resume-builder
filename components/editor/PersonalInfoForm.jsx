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
