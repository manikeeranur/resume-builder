// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
// });

// const User = mongoose.model("User", userSchema);
// export default User;

import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid"; // For UUID

const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      default: uuidv4, // Auto-generates a unique UUID
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
