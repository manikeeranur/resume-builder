import express from "express";
import {
  getExperience,
  postExperience,
} from "../controller/experience.controller.js";

// import authenticateJWT from "../middleware/authMiddleware.js";

const experienceRouter = express.Router();

experienceRouter.get("/", getExperience);
experienceRouter.post("/", postExperience);
// blogRouter.post("/", authenticateJWT, postBlog);
// blogRouter.put("/:id", putBlog);
// blogRouter.delete("/:id", deleteBlog);

export default experienceRouter;
