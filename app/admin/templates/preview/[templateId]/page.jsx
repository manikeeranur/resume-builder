import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/requireAdmin";
import ResumeDocument from "@/components/templates/ResumeDocument";
import { sampleResume } from "@/lib/sampleResume";
import { mergeProfileIntoSample } from "@/lib/mergeProfileIntoSample";
import dbConnect from "@/lib/db";
import Profile from "@/lib/models/Profile";

// Deliberately outside the app/admin/(protected) route group — that layout
// wraps pages in the admin sidebar/chrome, which must NOT show up here: the
// admin PDF-preview route (app/api/admin/templates/[id]/pdf) points
// Puppeteer straight at this page and screenshots whatever's under
// #resume-content, exactly like app/resumes/[id]/print does for real users.
export default async function TemplatePreviewPage({ params, searchParams }) {
  const session = await requireAdmin();
  if (!session) notFound();

  // Previewing with the admin's own name/photo/etc. (falling back to the
  // fictional sample for anything they haven't filled in — see
  // mergeProfileIntoSample) reads more naturally than a fixed persona every
  // admin sees. `.lean()` for a plain, Client-Component-serializable object.
  await dbConnect();
  const profile = await Profile.findOne({ userId: session.user.id }).lean();

  const resume = { ...mergeProfileIntoSample(sampleResume, profile), templateId: params.templateId };
  const draft = searchParams?.draft === "1";

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <ResumeDocument resume={resume} draft={draft} />
    </div>
  );
}
