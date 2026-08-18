// Breathing room above/below the resume content in scaled thumbnail/preview
// widgets (unscaled px, at the templates' 962px base width), so content
// doesn't sit flush against the card edges.
export const PAGE_MARGIN_PX = 56;

export const SPACING_SCALE = {
  compact: { section: "0.75rem", block: "0.5rem", text: "0.78rem", heading: "1.35rem" },
  comfortable: { section: "1.1rem", block: "0.75rem", text: "0.85rem", heading: "1.6rem" },
  spacious: { section: "1.5rem", block: "1rem", text: "0.9rem", heading: "1.75rem" },
};

export function skillItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items === "string") return items.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

// Date fields are edited with native <input type="month"|"date"> pickers,
// which store values as "YYYY-MM"/"YYYY-MM-DD" — reformat those into
// readable text for display. Older free-text values (e.g. "Jan 2019",
// entered before the date picker existed) don't match either pattern and
// are passed through unchanged.
export function formatMonthYear(value) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatFullDate(value) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function dateRange(startDate, endDate, current) {
  const start = formatMonthYear(startDate);
  const end = formatMonthYear(endDate);
  if (!start && !end) return "";
  return `${start}${start && (end || current) ? " – " : ""}${current ? "Present" : end}`;
}

export function themeVars(themeConfig) {
  const scale = SPACING_SCALE[themeConfig?.spacing] || SPACING_SCALE.comfortable;
  return {
    "--resume-primary": themeConfig?.primaryColor || "#6d5ce8",
    "--resume-font": `"${themeConfig?.font || "Poppins"}"`,
    "--resume-section-gap": scale.section,
    "--resume-block-gap": scale.block,
    "--resume-text": scale.text,
    "--resume-heading": scale.heading,
  };
}
