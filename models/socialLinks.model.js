import { model, Schema } from "mongoose";

const socialLinksSchema = new Schema(
  {
    user_id: { type: String, required: true },
    blog: { type: String, required: true },
    portfolio: { type: String, required: true },
    gitHub: { type: String, required: true },
    linkedIn: { type: String, required: true },
    whatsapp: { type: String, required: true },
  }
  // { timestamps: true }
);

const SocialLinksModel = model("TechnicalsocialLinks", socialLinksSchema);

export default SocialLinksModel;
