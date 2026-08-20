"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Crown, Lock } from "lucide-react";
import CustomTable from "@/components/common/CustomTable";
import CustomThreeDotMenu from "@/components/common/CustomThreeDotMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Select from "@/components/ui/Select";
import { TEMPLATE_LIST, TEMPLATE_CATEGORY_OPTIONS } from "@/lib/templates";

export default function TemplatesTable() {
  const router = useRouter();
  const [templates, setTemplates] = useState(null);
  const [builtinOverrides, setBuiltinOverrides] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState(null);
  const [savingCategoryId, setSavingCategoryId] = useState(null);
  const [categoryError, setCategoryError] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/templates")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => setTemplates([]));
    fetch("/api/admin/templates/builtin-categories")
      .then((r) => r.json())
      .then(setBuiltinOverrides)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The 6 built-in templates ship as static files (components/templates/
  // Template1.jsx..Template6.jsx), not a Template document — there's no code,
  // thumbnail, premium flag etc. to edit for them. Category is the one
  // exception (see TemplateOverride), so it's merged in here from whatever
  // was fetched above, falling back to TEMPLATE_LIST's hardcoded default.
  // `id` stands in for `_id` as this table's rowKey.
  const builtInRows = useMemo(
    () =>
      TEMPLATE_LIST.map((t) => ({
        _id: t.id,
        name: t.name,
        templateId: t.id,
        premium: t.premium,
        category: t.id in builtinOverrides ? builtinOverrides[t.id] : t.category || null,
        updatedAt: null,
        isBuiltIn: true,
      })),
    [builtinOverrides]
  );

  const handleDelete = async (template) => {
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

  const handleCategoryChange = async (template, category) => {
    setCategoryError("");
    const previous = template.category;
    setSavingCategoryId(template._id);
    // Optimistic update — reverted below if the PATCH fails.
    setTemplates((prev) => prev.map((t) => (t._id === template._id ? { ...t, category: category || null } : t)));
    try {
      const res = await fetch(`/api/admin/templates/${template._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update category");
    } catch (err) {
      setCategoryError(err.message);
      setTemplates((prev) => prev.map((t) => (t._id === template._id ? { ...t, category: previous } : t)));
    } finally {
      setSavingCategoryId(null);
    }
  };

  const handleBuiltinCategoryChange = async (template, category) => {
    setCategoryError("");
    const hadOverride = template.templateId in builtinOverrides;
    const previous = builtinOverrides[template.templateId];
    setSavingCategoryId(template._id);
    setBuiltinOverrides((prev) => ({ ...prev, [template.templateId]: category || null }));
    try {
      const res = await fetch(`/api/admin/templates/builtin/${template.templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update category");
    } catch (err) {
      setCategoryError(err.message);
      setBuiltinOverrides((prev) => {
        if (!hadOverride) {
          const { [template.templateId]: _omit, ...rest } = prev;
          return rest;
        }
        return { ...prev, [template.templateId]: previous };
      });
    } finally {
      setSavingCategoryId(null);
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
      key: "category",
      title: "Category",
      render: (t) => (
        <div className={`w-36 ${savingCategoryId === t._id ? "pointer-events-none opacity-60" : ""}`} onClick={(e) => e.stopPropagation()}>
          <Select
            value={t.category || ""}
            onChange={(value) => (t.isBuiltIn ? handleBuiltinCategoryChange(t, value) : handleCategoryChange(t, value))}
            options={TEMPLATE_CATEGORY_OPTIONS}
          />
        </div>
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
            No actions
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
                onClick: () => setDeleteConfirmTemplate(t),
              },
            ]}
          />
        ),
    },
  ];

  const rows = [...builtInRows, ...(templates || [])];

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {categoryError && <p className="text-sm text-red-600">{categoryError}</p>}

      <CustomTable
        columns={columns}
        data={rows}
        loading={templates === null}
        emptyMessage="No templates found."
        rowKey="_id"
      />

      <ConfirmDialog
        open={Boolean(deleteConfirmTemplate)}
        title="Delete template?"
        message={`Delete "${deleteConfirmTemplate?.name}"? This can't be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deletingId === deleteConfirmTemplate?._id}
        onConfirm={() => {
          const template = deleteConfirmTemplate;
          setDeleteConfirmTemplate(null);
          handleDelete(template);
        }}
        onCancel={() => setDeleteConfirmTemplate(null)}
      />
    </div>
  );
}
