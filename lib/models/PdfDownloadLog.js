import mongoose from "mongoose";

// One row per *confirmed* successful PDF download (never for a failed
// generation) — Resume.downloadCount is a lifetime total for the dashboard
// stat card and can't tell how many downloads happened in the current
// billing period, which is what the plan's pdfDownloadLimit needs.
const pdfDownloadLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Not `ref`-populated for display purposes — resumeId alone goes stale
    // the moment a user deletes that resume (populate then returns null),
    // which is exactly what made admin's download history show
    // "(deleted resume)" / "—" for anything the user had since removed.
    // resumeTitle/templateId are captured once, at download time, so this
    // row stays a true historical record independent of the resume's
    // continued existence. resumeId itself is kept only for the still-valid
    // case (resume not yet deleted) — e.g. linking back to it from admin.
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true },
    resumeTitle: { type: String },
    templateId: { type: String },
    // The exact bytes the user downloaded, so admin can pull the real file
    // back up later — including after the resume itself is gone and it can
    // no longer be regenerated. select: false (mirrors Resume.previewPdf):
    // keeps this out of ordinary list/count queries, which don't need it.
    pdfSnapshot: { type: Buffer, select: false },
    // Mirrors whether pdfSnapshot was set, kept as its own selected field so
    // a list view can show/hide a "Download PDF" link without pulling every
    // row's full PDF bytes just to check.
    hasSnapshot: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

pdfDownloadLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.PdfDownloadLog || mongoose.model("PdfDownloadLog", pdfDownloadLogSchema);
