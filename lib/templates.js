export const TEMPLATE_LIST = [
  { id: "template-1", name: "Template 1", available: true, thumbnail: "/templates/template-1.png" },
  { id: "template-2", name: "Template 2", available: true, thumbnail: "/templates/template-2.png" },
  // defaultColor seeds a new resume's theme so it starts out matching the
  // template's own reference design instead of the app-wide black default.
  { id: "template-3", name: "Template 3", available: true, thumbnail: "/templates/template-3.png", defaultColor: "#1696bf" },
  { id: "template-4", name: "Template 4", available: true, thumbnail: "/templates/template-4.png", defaultColor: "#1a5f4f" },
];

export function getTemplate(id) {
  return TEMPLATE_LIST.find((t) => t.id === id) || TEMPLATE_LIST[0];
}
