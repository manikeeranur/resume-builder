import express from "express";
import {
  getSocialLinks,
  postSocialLinks,
} from "../controller/socialLinks.controller.js";

const socialLinksRouter = express.Router();

socialLinksRouter.get("/", getSocialLinks);
socialLinksRouter.post("/", postSocialLinks);

export default socialLinksRouter;
