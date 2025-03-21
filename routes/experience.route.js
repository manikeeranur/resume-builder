import express from "express";
import {
  deleteExperience,
  getExperience,
  postExperience,
  updateExperience,
} from "../controller/experience.controller.js";

const experienceRouter = express.Router();

experienceRouter.get("/", getExperience);
experienceRouter.post("/", postExperience);
experienceRouter.put("/:id", updateExperience);
experienceRouter.delete("/:id", deleteExperience);

export default experienceRouter;
