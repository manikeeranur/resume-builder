import { redirect } from "next/navigation";

// The template editor is now a distraction-free full page outside the admin
// sidebar chrome (see app/admin/templates/editor/[id]) — this old in-sidebar
// route just forwards old links/bookmarks there.
export default function TemplateEditorPage({ params }) {
  redirect(`/admin/templates/editor/${params.id}`);
}
