import mongoose from "mongoose";

// One row per *confirmed* successful PDF download (never for a failed
// generation) — Resume.downloadCount is a lifetime total for the dashboard
// stat card and can't tell how many downloads happened in the current
// billing period, which is what the plan's pdfDownloadLimit needs.
const pdfDownloadLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

pdfDownloadLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.PdfDownloadLog || mongoose.model("PdfDownloadLog", pdfDownloadLogSchema);
