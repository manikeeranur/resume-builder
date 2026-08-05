"use client";

import { useEffect, useState } from "react";
import { Gift, CalendarDays, Crown, Save, Check } from "lucide-react";
import Toggle from "@/components/ui/Toggle";

const LIMIT_FIELDS = [
  { key: "resumeLimit", label: "Resume limit (blank = unlimited)" },
  { key: "pdfDownloadLimit", label: "PDF download limit (blank = unlimited)" },
];

const TOGGLES = [
  { key: "premiumTemplateAccess", label: "Premium templates" },
  { key: "watermarkEnabled", label: "Watermark" },
  { key: "customColors", label: "Custom colors" },
  { key: "customFonts", label: "Custom fonts" },
  { key: "active", label: "Active (purchasable)" },
];

// Purely cosmetic per billing tier — Yearly gets the richer/darker
// treatment as the "best value" plan, matching how it's already
// highlighted on the public pricing page (see PlanCard's `highlighted`).
const VISUALS = {
  FREE: {
    icon: Gift,
    header: "bg-gradient-to-br from-[#f3f1ff] to-[#e6e0ff]",
    iconBg: "bg-white/80 text-primary",
    badge: "bg-white text-primary",
    text: "text-text",
  },
  MONTHLY: {
    icon: CalendarDays,
    header: "bg-gradient-to-br from-[#e6e0ff] to-[#cfc3fd]",
    iconBg: "bg-white/70 text-primary",
    badge: "bg-white text-primary",
    text: "text-text",
  },
  YEARLY: {
    icon: Crown,
    header: "bg-gradient-to-br from-primary to-[#5b4bd1]",
    iconBg: "bg-white/20 text-white",
    badge: "bg-white/25 text-white",
    text: "text-white",
  },
};

function PlanEditRow({ plan, onSaved }) {
  const [form, setForm] = useState(plan);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState("");
  const visual = VISUALS[plan.billingType] || VISUALS.FREE;
  const Icon = visual.icon;

  const setField = (key, value) => {
    setSavedAt(null);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      for (const f of [{ key: "price" }, { key: "durationDays" }, ...LIMIT_FIELDS]) {
        if (LIMIT_FIELDS.some((l) => l.key === f.key) && (payload[f.key] === "" || payload[f.key] === null)) {
          payload[f.key] = null;
        } else {
          payload[f.key] = Number(payload[f.key]);
        }
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
    <div className="card overflow-hidden">
      <div className={`relative px-5 py-4 ${visual.header} ${visual.text}`}>
        <div className="flex items-center gap-2 pr-12">
          <h3 className="text-base font-bold">{plan.name}</h3>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${visual.badge}`}>{plan.code}</span>
        </div>
        <span className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl ${visual.iconBg}`}>
          <Icon size={20} />
        </span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-secondary">Price (₹)</p>
            <input
              type="number"
              className="mt-0.5 w-full border-0 bg-transparent p-0 text-lg font-extrabold text-primary focus:outline-none focus:ring-0"
              value={form.price ?? ""}
              onChange={(e) => setField("price", e.target.value)}
            />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Duration (days)</p>
            <input
              type="number"
              className="mt-0.5 w-full border-0 bg-transparent p-0 text-lg font-extrabold text-text focus:outline-none focus:ring-0"
              value={form.durationDays ?? ""}
              onChange={(e) => setField("durationDays", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {LIMIT_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-text-secondary">{f.label}</label>
              <input
                type="number"
                className="input-field mt-1"
                value={form[f.key] ?? ""}
                onChange={(e) => setField(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 divide-y divide-border">
          {TOGGLES.map((t) => (
            <Toggle
              key={t.key}
              label={t.label}
              checked={Boolean(form[t.key])}
              onChange={(value) => setField(t.key, value)}
            />
          ))}
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-primary mt-4 flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
        >
          <Save size={15} />
          {saving ? "Saving…" : "Save changes"}
        </button>
        {savedAt && (
          <p className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-success">
            <Check size={13} /> Saved
          </p>
        )}
      </div>
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
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
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
