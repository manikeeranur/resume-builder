import express from "express";
import {
  getPersonalDetails,
  postPersonalDetails,
} from "../controller/personalDetails.controller.js";

// import authenticateJWT from "../middleware/authMiddleware.js";

const personalDetailsRouter = express.Router();

personalDetailsRouter.get("/", getPersonalDetails);
personalDetailsRouter.post("/", postPersonalDetails);
// blogRouter.post("/", authenticateJWT, postBlog);
// blogRouter.put("/:id", putBlog);
// blogRouter.delete("/:id", deleteBlog);

export default personalDetailsRouter;
