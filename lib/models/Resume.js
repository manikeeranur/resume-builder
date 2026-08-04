import mongoose from "mongoose";

// Section content arrays are Mixed so each resume can hold arbitrary
// entries (experience, projects, education, ...) without a rigid sub-schema.
const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "Untitled Resume" },
    templateId: { type: String, default: "modern-pro" },
    themeConfig: {
      primaryColor: { type: String, default: "#6d5ce8" },
      font: { type: String, default: "Poppins" },
      layout: { type: String, enum: ["single", "two-column"], default: "two-column" },
      spacing: { type: String, enum: ["compact", "comfortable", "spacious"], default: "comfortable" },
    },
    sections: {
      personalInfo: {
        fullName: String,
        title: String,
        email: String,
        phone: String,
        location: String,
        linkedin: String,
        github: String,
        portfolio: String,
        photo: String,
        showPhoto: { type: Boolean, default: true },
        dateOfBirth: String,
      },
      summary: { type: String, default: "" },
      experience: { type: [mongoose.Schema.Types.Mixed], default: [] },
      projects: { type: [mongoose.Schema.Types.Mixed], default: [] },
      skills: { type: [mongoose.Schema.Types.Mixed], default: [] },
      education: { type: [mongoose.Schema.Types.Mixed], default: [] },
      certifications: { type: [mongoose.Schema.Types.Mixed], default: [] },
      languages: { type: [mongoose.Schema.Types.Mixed], default: [] },
      achievements: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    lastEditedAt: { type: Date, default: Date.now },
    downloadCount: { type: Number, default: 0 },
    // Cached page-1 PDF for dashboard preview cards, so a dashboard visit
    // doesn't have to re-render through Puppeteer every time — only when
    // previewGeneratedAt is older than this doc's updatedAt (i.e. something
    // actually changed since the cached preview was made). `select: false`
    // keeps it out of normal queries (resume list, editor fetch) since it's
    // only needed by the preview endpoint.
    previewPdf: { type: Buffer, select: false },
    previewGeneratedAt: { type: Date, select: false },
  },
  { timestamps: true }
);

export default mongoose.models.Resume || mongoose.model("Resume", resumeSchema);
