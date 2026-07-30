export const TEMPLATE_LIST = [
  { id: "template-1", name: "Template 1", available: true, thumbnail: "/templates/template-1.png" },
  { id: "template-2", name: "Template 2", available: true, thumbnail: "/templates/template-2.png" },
];

export function getTemplate(id) {
  return TEMPLATE_LIST.find((t) => t.id === id) || TEMPLATE_LIST[0];
}
