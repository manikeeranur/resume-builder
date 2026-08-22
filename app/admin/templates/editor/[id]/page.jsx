import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TemplateEditorForm from "@/components/admin/templates/TemplateEditorForm";

// Deliberately outside app/admin/(protected) — that route group's layout
// wraps every page in AdminSidebar/AdminTopNavbar, which this distraction-free,
// full-page code editor must NOT show (opened in its own tab from the
// templates list, code should get most of the screen, not a fraction of it
// next to a sidebar). Auth/role redirect logic below mirrors
// app/admin/(protected)/layout.jsx exactly since there's no shared layout
// to inherit it from here.
export default async function TemplateEditorPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  // params.id is either a real Template _id (edit) or the literal "new" —
  // TemplateEditorForm handles both.
  return <TemplateEditorForm templateDocId={params.id} />;
}
