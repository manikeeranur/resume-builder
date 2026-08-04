import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { FileText, Download, Eye, Target, Sparkles, FilePlus2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Resume from "@/lib/models/Resume";
import Profile from "@/lib/models/Profile";
import ResumeGrid from "@/components/dashboard/ResumeGrid";
import StatCard from "@/components/dashboard/StatCard";
import { profileCompleteness } from "@/lib/profileCompleteness";
import { emptyResumeSections } from "@/lib/resumeDefaults";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/templates");

  await dbConnect();
  const [resumes, profile, totalResumes, allDownloadCounts] = await Promise.all([
    Resume.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(4),
    Profile.findOne({ userId: session.user.id }),
    // Recent widget below only fetches 4 — this stat needs the true total.
    Resume.countDocuments({ userId: session.user.id }),
    Resume.find({ userId: session.user.id }).select("downloadCount"),
  ]);
  const totalDownloads = allDownloadCounts.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
  const completeness = profileCompleteness(profile?.sections || emptyResumeSections);

  const stats = [
    { icon: FileText, value: totalResumes, label: "Resumes Created", tint: { bg: "var(--primary-light)", fg: "var(--primary)" } },
    { icon: Download, value: totalDownloads, label: "Total Downloads", tint: { bg: "#e0f2fe", fg: "#0284c7" } },
    { icon: Eye, value: 0, label: "Profile Views", tint: { bg: "#dcfce7", fg: "#16a34a" } },
    { icon: Target, value: "—", label: "Avg ATS Score", tint: { bg: "#fef3c7", fg: "#d97706" } },
  ];

  return (
    <>
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#8a7cf0] p-6 text-white shadow-card-lg sm:p-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Welcome back, {session.user.name?.split(" ")[0]} 👋
              </h1>
              <p className="mt-1 text-sm text-white/80">Build your perfect resume</p>
            </div>
            <Link
              href="/templates"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <FilePlus2 size={16} />
              Create New Resume
            </Link>
          </div>

          {completeness.percent < 100 && (
            <Link
              href="/profile"
              className="mt-5 flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm transition-colors hover:bg-white/15"
            >
              <Sparkles size={16} className="shrink-0" />
              <span className="flex-1">
                Your profile is {completeness.percent}% complete — fill it in once to auto-fill every new resume.
              </span>
              <span className="shrink-0 font-semibold underline">Complete it →</span>
            </Link>
          )}
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-text">Recent Resumes</h2>
          {resumes.length > 0 && (
            <Link href="/resumes" className="text-sm font-semibold text-primary hover:underline">
              View all →
            </Link>
          )}
        </div>

        {resumes.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
              <FileText size={24} />
            </span>
            <p className="font-semibold text-text">You haven&apos;t created a resume yet</p>
            <p className="max-w-xs text-sm text-text-secondary">
              Pick a template and start building — it only takes a few minutes.
            </p>
            <Link href="/templates" className="btn-primary px-5 py-2.5 text-sm">
              Choose a Template
            </Link>
          </div>
        ) : (
          <ResumeGrid resumes={resumes.map((r) => JSON.parse(JSON.stringify(r.toObject())))} />
        )}
      </div>
    </>
  );
}
