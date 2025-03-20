import { model, Schema } from "mongoose";

const experienceSchema = new Schema(
  {
    user_id: { type: String, required: true },
    role: { type: String, required: true },
    companyName: { type: String, required: true },
    company_website: { type: String, default: "" },
    job_type: { type: String, default: "Full Time" },
    location: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, default: null },
    currently_working: { type: Boolean, default: false },
    technology: { type: String, required: true },
    project: { type: String, required: true },
    client: { type: String, default: "" },
    projectDescription: { type: [String], required: true },
  }
  // { timestamps: true }
);

const ExperienceModel = model("Experience", experienceSchema);

export default ExperienceModel;
