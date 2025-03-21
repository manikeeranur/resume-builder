import express from "express";
import {
  deletePersonalDetails,
  getPersonalDetails,
  postPersonalDetails,
  updatePersonalDetails,
} from "../controller/personalDetails.controller.js";

// import authenticateJWT from "../middleware/authMiddleware.js";

const personalDetailsRouter = express.Router();

personalDetailsRouter.get("/", getPersonalDetails);
personalDetailsRouter.post("/", postPersonalDetails);
personalDetailsRouter.put("/:id", updatePersonalDetails);
personalDetailsRouter.delete("/:id", deletePersonalDetails);

export default personalDetailsRouter;
