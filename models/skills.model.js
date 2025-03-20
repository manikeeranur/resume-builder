import { model, Schema } from "mongoose";

const skillsSchema = new Schema(
  {
    user_id: { type: String, required: true },
    title: { type: String, required: true },
    value: { type: String, required: true },
  }
  // { timestamps: true }
);

const SkillsModel = model("TechnicalSkills", skillsSchema);

export default SkillsModel;
