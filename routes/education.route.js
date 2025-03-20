import express from "express";
import {
  getEducation,
  postEducation,
} from "../controller/education.controller.js";

// import authenticateJWT from "../middleware/authMiddleware.js";

const educationRouter = express.Router();

educationRouter.get("/", getEducation);
educationRouter.post("/", postEducation);
// blogRouter.post("/", authenticateJWT, postBlog);
// blogRouter.put("/:id", putBlog);
// blogRouter.delete("/:id", deleteBlog);

export default educationRouter;
