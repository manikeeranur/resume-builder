import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { FileText, ChevronLeft, ChevronRight, FilePlus2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Resume from "@/lib/models/Resume";
import ResumeGrid from "@/components/dashboard/ResumeGrid";
import ResumesFilterBar from "@/components/dashboard/ResumesFilterBar";
import { TEMPLATE_CATEGORIES } from "@/lib/templates";
import { getMergedTemplateList } from "@/lib/templatesServer";

const PAGE_SIZE = 4;

export default async function ResumesPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/templates");

  const page = Math.max(1, parseInt(searchParams?.page, 10) || 1);
  const sort = searchParams?.sort === "oldest" ? "oldest" : "newest";
  const category = TEMPLATE_CATEGORIES.includes(searchParams?.category) ? searchParams.category : "all";

  const query = { userId: session.user.id };
  if (category !== "all") {
    // Category lives on the template (built-in + override, or a dynamic
    // Template doc — see getMergedTemplateList), not on the Resume itself,
    // so resolve it to the set of matching template ids first.
    const allTemplates = await getMergedTemplateList();
    const idsInCategory = allTemplates.filter((t) => t.category === category).map((t) => t.id);
    query.templateId = { $in: idsInCategory };
  }

  await dbConnect();
  const [resumes, total] = await Promise.all([
    Resume.find(query)
      .sort({ createdAt: sort === "oldest" ? 1 : -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    Resume.countDocuments(query),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Pagination links need to carry the active filters forward.
  const pageHref = (p) => {
    const params = new URLSearchParams();
    if (sort !== "newest") params.set("sort", sort);
    if (category !== "all") params.set("category", category);
    params.set("page", String(p));
    return `/resumes?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">All Resumes</h1>
        <Link
          href="/templates"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
        >
          <FilePlus2 size={16} />
          Create New Resume
        </Link>
      </div>

      <Suspense fallback={<div className="mb-6 h-9" />}>
        <ResumesFilterBar />
      </Suspense>

      {resumes.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
            <FileText size={24} />
          </span>
          {category !== "all" ? (
            <>
              <p className="font-semibold text-text">No resumes in this category</p>
              <p className="max-w-xs text-sm text-text-secondary">Try a different category filter.</p>
              <Link href="/resumes" className="btn-primary px-5 py-2.5 text-sm">
                Clear filter
              </Link>
            </>
          ) : (
            <>
              <p className="font-semibold text-text">You haven&apos;t created a resume yet</p>
              <p className="max-w-xs text-sm text-text-secondary">
                Pick a template and start building — it only takes a few minutes.
              </p>
              <Link href="/templates" className="btn-primary px-5 py-2.5 text-sm">
                Choose a Template
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <ResumeGrid resumes={resumes.map((r) => JSON.parse(JSON.stringify(r.toObject())))} />

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href={pageHref(page - 1)}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
                className={`btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm ${
                  page <= 1 ? "pointer-events-none opacity-40" : ""
                }`}
              >
                <ChevronLeft size={15} />
                Previous
              </Link>
              <span className="px-2 text-sm text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <Link
                href={pageHref(page + 1)}
                aria-disabled={page >= totalPages}
                tabIndex={page >= totalPages ? -1 : undefined}
                className={`btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm ${
                  page >= totalPages ? "pointer-events-none opacity-40" : ""
                }`}
              >
                Next
                <ChevronRight size={15} />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
