"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Crown, Lock } from "lucide-react";
import CustomTable from "@/components/common/CustomTable";
import CustomThreeDotMenu from "@/components/common/CustomThreeDotMenu";
import { TEMPLATE_LIST } from "@/lib/templates";

// The 6 built-in templates ship as static files (components/templates/
// Template1.jsx..Template6.jsx), not a Template document — there's nothing
// to fetch, edit or delete here. Shown as plain rows alongside the
// DB-backed ones purely for visibility (so this list reflects every
// template a real user can pick, not just the custom ones), with `id`
// standing in for `_id` as this table's rowKey.
const BUILT_IN_ROWS = TEMPLATE_LIST.map((t) => ({
  _id: t.id,
  name: t.name,
  templateId: t.id,
  premium: t.premium,
  updatedAt: null,
  isBuiltIn: true,
}));

export default function TemplatesTable() {
  const router = useRouter();
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

  const columns = [
    { key: "name", title: "Name", sortable: true, render: (t) => <span className="font-medium text-text">{t.name}</span> },
    { key: "templateId", title: "Template ID", sortable: true, render: (t) => <span className="font-mono text-xs text-text-secondary">{t.templateId}</span> },
    {
      key: "premium",
      title: "Plan",
      render: (t) =>
        t.premium ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary">
            <Crown size={11} /> Premium
          </span>
        ) : (
          <span className="text-text-secondary">Free</span>
        ),
    },
    {
      key: "active",
      title: "Status",
      render: (t) =>
        t.isBuiltIn ? (
          <span className="rounded-full bg-bg px-2 py-0.5 text-xs font-semibold text-text-secondary">Built-in</span>
        ) : (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.active ? "bg-green-50 text-green-700" : "bg-bg text-text-secondary"}`}>
            {t.active ? "Active" : "Draft"}
          </span>
        ),
    },
    {
      key: "updatedAt",
      title: "Updated",
      sortable: true,
      sortValue: (t) => (t.updatedAt ? new Date(t.updatedAt) : new Date(0)),
      render: (t) => <span className="text-text-secondary">{t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("en-IN") : "—"}</span>,
    },
    {
      key: "actions",
      title: "Actions",
      render: (t) =>
        t.isBuiltIn ? (
          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Lock size={12} />
            Not editable
          </span>
        ) : (
          <CustomThreeDotMenu
            actions={[
              { label: "Edit", icon: <Pencil size={14} />, onClick: () => router.push(`/admin/templates/${t._id}`) },
              {
                label: "Delete",
                icon: <Trash2 size={14} />,
                destructive: true,
                disabled: deletingId === t._id,
                onClick: () => handleDelete(t),
              },
            ]}
          />
        ),
    },
  ];

  const rows = [...BUILT_IN_ROWS, ...(templates || [])];

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <CustomTable
        columns={columns}
        data={rows}
        loading={templates === null}
        emptyMessage="No templates found."
        rowKey="_id"
      />
    </div>
  );
}
