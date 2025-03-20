import express from "express";
import { getUserDetails, login, signup } from "../controller/authController.js";
import authenticateJWT from "../middleware/authMiddleware.js";

const authRoutes = express.Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.get("/userDetails/:user_id", getUserDetails);
// authRoutes.get("/profile", authenticateJWT, getProfile);

export default authRoutes;
