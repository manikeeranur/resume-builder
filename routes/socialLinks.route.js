import express from "express";
import {
  deleteSocialLinks,
  getSocialLinks,
  postSocialLinks,
  updateSocialLinks,
} from "../controller/socialLinks.controller.js";

const socialLinksRouter = express.Router();

socialLinksRouter.get("/", getSocialLinks);
socialLinksRouter.post("/", postSocialLinks);
socialLinksRouter.put("/:id", updateSocialLinks);
socialLinksRouter.delete("/:id", deleteSocialLinks);

export default socialLinksRouter;
