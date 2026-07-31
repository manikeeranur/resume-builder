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

export function dateRange(startDate, endDate, current) {
  if (!startDate && !endDate) return "";
  return `${startDate || ""}${startDate && (endDate || current) ? " – " : ""}${current ? "Present" : endDate || ""}`;
}

export function themeVars(themeConfig) {
  const scale = SPACING_SCALE[themeConfig?.spacing] || SPACING_SCALE.comfortable;
  return {
    "--resume-primary": themeConfig?.primaryColor || "#6d5ce8",
    "--resume-font": themeConfig?.font || "Poppins",
    "--resume-section-gap": scale.section,
    "--resume-block-gap": scale.block,
    "--resume-text": scale.text,
    "--resume-heading": scale.heading,
  };
}
