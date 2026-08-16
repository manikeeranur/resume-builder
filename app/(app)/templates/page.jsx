import TemplateGalleryGrid from "@/components/templates/TemplateGalleryGrid";

// Open to anonymous visitors — see TemplateGalleryGrid for the local-draft
// flow used when there's no session. This lives in the (app) route group,
// so it always gets the DashboardShell sidebar (see that layout) — its
// AvatarMenu already has a built-in "Sign in" fallback (opens LoginModal in
// place) when there's no user, so the same shell works for both anonymous
// and logged-in visitors instead of switching chrome between them.
export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-text">Choose a Template</h1>
      <p className="mt-1 text-sm text-text-secondary">Pick a template that fits your style</p>
      <div className="mt-8">
        <TemplateGalleryGrid />
      </div>
    </div>
  );
}
