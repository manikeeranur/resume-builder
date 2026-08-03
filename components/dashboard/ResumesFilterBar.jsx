"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TEMPLATE_LIST } from "@/lib/templates";
import Select from "@/components/ui/Select";

const SORT_OPTIONS = [
  { value: "newest", label: "Latest created" },
  { value: "oldest", label: "Oldest created" },
];

const TEMPLATE_OPTIONS = [
  { value: "all", label: "All templates" },
  ...TEMPLATE_LIST.map((t) => ({ value: t.id, label: t.name })),
];

export default function ResumesFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = searchParams.get("sort") || "newest";
  const template = searchParams.get("template") || "all";

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "newest") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // A changed filter invalidates whatever page you were on.
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary">Sort</span>
        <Select value={sort} onChange={(v) => updateParam("sort", v)} options={SORT_OPTIONS} className="w-44" />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary">Template</span>
        <Select
          value={template}
          onChange={(v) => updateParam("template", v)}
          options={TEMPLATE_OPTIONS}
          className="w-44"
        />
      </div>
    </div>
  );
}
