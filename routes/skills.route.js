import express from "express";
import {
  deleteSkills,
  getSkills,
  postSkills,
  updateSkills,
} from "../controller/skills.controller.js";

// import authenticateJWT from "../middleware/authMiddleware.js";

const skillsRouter = express.Router();

skillsRouter.get("/", getSkills);
skillsRouter.post("/", postSkills);
skillsRouter.put("/:id", updateSkills);
skillsRouter.delete("/:id", deleteSkills);

export default skillsRouter;
