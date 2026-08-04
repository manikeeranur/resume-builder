import dbConnect from "@/lib/db";
import PdfDownloadLog from "@/lib/models/PdfDownloadLog";
import { getUserPlan } from "@/lib/subscription/get-user-plan";

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Paid users are metered from their current subscription's startDate (their
// personal billing cycle); free users — who have no Subscription document —
// are metered by calendar month instead.
export async function checkDownloadLimit(userId) {
  await dbConnect();
  const { plan, subscription } = await getUserPlan(userId);
  if (plan.pdfDownloadLimit == null) {
    return { allowed: true, limit: null, used: null, plan };
  }
  const periodStart = subscription ? subscription.startDate : startOfCurrentMonth();
  const used = await PdfDownloadLog.countDocuments({ userId, createdAt: { $gte: periodStart } });
  return { allowed: used < plan.pdfDownloadLimit, limit: plan.pdfDownloadLimit, used, plan };
}

// Called only after a download has actually been streamed to the user —
// never for a failed PDF generation.
export async function recordPdfDownload(userId, resumeId) {
  await dbConnect();
  await PdfDownloadLog.create({ userId, resumeId });
}
