import { SECTION_LIST } from "@/lib/resumeDefaults";

function isSectionFilled(key, sections) {
  const value = sections?.[key];
  if (key === "personalInfo") return Boolean(value?.fullName?.trim());
  if (key === "summary") return Boolean(value?.trim());
  return Array.isArray(value) && value.length > 0;
}

export function profileCompleteness(sections) {
  const filled = SECTION_LIST.filter((s) => isSectionFilled(s.key, sections));
  const total = SECTION_LIST.length;
  return {
    percent: Math.round((filled.length / total) * 100),
    filledCount: filled.length,
    total,
    filledKeys: new Set(filled.map((s) => s.key)),
  };
}
