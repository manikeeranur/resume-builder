"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Crown } from "lucide-react";

export default function TemplatesTable() {
  const [templates, setTemplates] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/templates")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (template) => {
    if (!confirm(`Delete "${template.name}"? This can't be undone.`)) return;
    setError("");
    setDeletingId(template._id);
    try {
      const res = await fetch(`/api/admin/templates/${template._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setTemplates((prev) => prev.filter((t) => t._id !== template._id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!templates) return <p className="text-sm text-text-secondary">Loading templates…</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-white text-xs uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Template ID</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  No custom templates yet — the 6 built-in templates ship with the app and aren't managed here.
                </td>
              </tr>
            )}
            {templates.map((t) => (
              <tr key={t._id} className="border-b border-border align-top transition-colors last:border-0 hover:bg-bg">
                <td className="px-4 py-3 font-medium text-text">{t.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">{t.templateId}</td>
                <td className="px-4 py-3">
                  {t.premium ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary">
                      <Crown size={11} /> Premium
                    </span>
                  ) : (
                    <span className="text-text-secondary">Free</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      t.active ? "bg-green-50 text-green-700" : "bg-bg text-text-secondary"
                    }`}
                  >
                    {t.active ? "Active" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{new Date(t.updatedAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/templates/${t._id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text"
                      aria-label="Edit"
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      type="button"
                      disabled={deletingId === t._id}
                      onClick={() => handleDelete(t)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
