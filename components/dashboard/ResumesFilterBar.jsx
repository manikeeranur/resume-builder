"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TEMPLATE_CATEGORIES } from "@/lib/templates";
import Select from "@/components/ui/Select";

const SORT_OPTIONS = [
  { value: "newest", label: "Latest created" },
  { value: "oldest", label: "Oldest created" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All categories" },
  ...TEMPLATE_CATEGORIES.map((c) => ({ value: c, label: c })),
];

export default function ResumesFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = searchParams.get("sort") || "newest";
  const category = searchParams.get("category") || "all";

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
        <span className="text-sm text-text-secondary">Category</span>
        <Select
          value={category}
          onChange={(v) => updateParam("category", v)}
          options={CATEGORY_OPTIONS}
          className="w-44"
        />
      </div>
    </div>
  );
}
