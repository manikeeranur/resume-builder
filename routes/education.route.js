import express from "express";
import {
  deleteEducation,
  getEducation,
  postEducation,
  updateEducation,
} from "../controller/education.controller.js";

// import authenticateJWT from "../middleware/authMiddleware.js";

const educationRouter = express.Router();

educationRouter.get("/", getEducation);
educationRouter.post("/", postEducation);
educationRouter.put("/:id", updateEducation);
educationRouter.delete("/:id", deleteEducation);

export default educationRouter;
