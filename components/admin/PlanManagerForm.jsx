"use client";

import { useEffect, useState } from "react";

const FIELDS = [
  { key: "name", label: "Name", type: "text" },
  { key: "price", label: "Price (₹)", type: "number" },
  { key: "durationDays", label: "Duration (days)", type: "number" },
  { key: "resumeLimit", label: "Resume limit (blank = unlimited)", type: "number", nullable: true },
  { key: "pdfDownloadLimit", label: "PDF download limit (blank = unlimited)", type: "number", nullable: true },
];

const TOGGLES = [
  { key: "premiumTemplateAccess", label: "Premium templates" },
  { key: "watermarkEnabled", label: "Watermark" },
  { key: "customColors", label: "Custom colors" },
  { key: "customFonts", label: "Custom fonts" },
  { key: "active", label: "Active (purchasable)" },
];

function PlanEditRow({ plan, onSaved }) {
  const [form, setForm] = useState(plan);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      for (const f of FIELDS) {
        if (f.nullable && (payload[f.key] === "" || payload[f.key] === null)) payload[f.key] = null;
        else if (f.type === "number") payload[f.key] = Number(payload[f.key]);
      }
      const res = await fetch(`/api/admin/plans/${plan._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setForm(data);
      setSavedAt(Date.now());
      onSaved(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-text">
          {plan.name} <span className="ml-1 text-xs font-normal text-text-secondary">({plan.code} · {plan.billingType})</span>
        </h3>
        {savedAt && <span className="text-xs font-semibold text-success">Saved</span>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-semibold text-text-secondary">{f.label}</label>
            <input
              type={f.type}
              className="input-field mt-1"
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        {TOGGLES.map((t) => (
          <label key={t.key} className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={Boolean(form[t.key])}
              onChange={(e) => setForm({ ...form, [t.key]: e.target.checked })}
            />
            {t.label}
          </label>
        ))}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <button type="button" onClick={save} disabled={saving} className="btn-primary mt-4 px-4 py-2 text-sm">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

// Editing a plan here only affects future purchases — every Payment already
// stores the amount it was actually charged, so past invoices/history never
// change retroactively.
export default function PlanManagerForm() {
  const [plans, setPlans] = useState(null);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then(setPlans);
  }, []);

  if (!plans) return <p className="text-sm text-text-secondary">Loading plans…</p>;

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <PlanEditRow
          key={plan._id}
          plan={plan}
          onSaved={(updated) => setPlans((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))}
        />
      ))}
    </div>
  );
}
