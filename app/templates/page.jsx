import SessionAwareShell from "@/components/layout/SessionAwareShell";
import TemplateGalleryGrid from "@/components/templates/TemplateGalleryGrid";

// Open to anonymous visitors — see TemplateGalleryGrid for the local-draft
// flow used when there's no session. Lives outside both the (marketing)
// and (app) route groups so SessionAwareShell can pick the right chrome
// itself: public header/footer when anonymous, the dashboard sidebar shell
// when logged in — see that component for why.
export default function TemplatesPage() {
  return (
    <SessionAwareShell>
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-text">Choose a Template</h1>
        <p className="mt-1 text-sm text-text-secondary">Pick a template that fits your style</p>
        <div className="mt-8">
          <TemplateGalleryGrid />
        </div>
      </div>
    </SessionAwareShell>
  );
}
