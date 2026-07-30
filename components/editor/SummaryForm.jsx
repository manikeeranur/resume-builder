export default function SummaryForm({ value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-text-secondary">Professional Summary</label>
      <textarea
        className="input-field min-h-[160px]"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="A short paragraph highlighting your experience and strengths…"
      />
    </div>
  );
}
