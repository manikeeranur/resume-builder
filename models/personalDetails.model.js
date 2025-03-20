import { model, Schema } from "mongoose";

const personalDetailsSchema = new Schema({
  user_id: { type: String, required: true },
  title: { type: String, required: true },
  value: { type: String, required: true },
});

const PersonalDetailsModel = model("Skills", personalDetailsSchema);
export default PersonalDetailsModel;
