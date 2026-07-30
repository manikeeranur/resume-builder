// How much natural (unscaled, 850px-wide) resume content fits on one A4
// page of the real PDF export. NOT a naive "A4 height minus margins"
// calculation — Puppeteer's page.pdf() scales our 1024px viewport down to
// fit the printable area, which shrinks our content by a factor that isn't
// exposed anywhere, so this value was calibrated empirically: generate a
// real PDF, render it to an image, and measure exactly how many natural
// content px fit on page 1 before it broke to page 2. Verified against two
// independent resumes (single-page and multi-page) with matching results.
// Used to preview page breaks in the browser before downloading.
export const PDF_PAGE_HEIGHT_PX = 1225;

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
