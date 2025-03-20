import express from "express";
import { getSkills, postSkills } from "../controller/skills.controller.js";

// import authenticateJWT from "../middleware/authMiddleware.js";

const skillsRouter = express.Router();

skillsRouter.get("/", getSkills);
skillsRouter.post("/", postSkills);
// blogRouter.post("/", authenticateJWT, postBlog);
// blogRouter.put("/:id", putBlog);
// blogRouter.delete("/:id", deleteBlog);

export default skillsRouter;
