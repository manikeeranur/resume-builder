import { model, Schema } from "mongoose";

const educationSchema = new Schema(
  {
    user_id: { type: String, required: true },
    degree: { type: String, required: true },
    institute: { type: String, required: true },
    year: { type: String, required: true },
    percentage: { type: String, required: true },
  }
  //   { timestamps: true }
);

const EducationModel = model("Education", educationSchema);

export default EducationModel;
