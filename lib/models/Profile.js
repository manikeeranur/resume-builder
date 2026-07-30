import mongoose from "mongoose";

// One profile per user — the master copy of their details, used to prefill
// new resumes so they don't start from a blank form every time.
const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
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
  },
  { timestamps: true }
);

export default mongoose.models.Profile || mongoose.model("Profile", profileSchema);
