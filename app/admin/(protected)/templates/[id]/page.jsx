import TemplateEditorForm from "@/components/admin/templates/TemplateEditorForm";

// params.id is either a real Template _id (edit) or the literal "new" —
// TemplateEditorForm handles both, so /admin/templates/new needs no
// separate route.
export default function TemplateEditorPage({ params }) {
  return <TemplateEditorForm templateDocId={params.id} />;
}
