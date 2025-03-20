import express from "express";
import dotenv from "dotenv";
import connectDB from "./lib/db.js";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import educationRouter from "./routes/education.route.js";
import experienceRouter from "./routes/experience.route.js";
import skillsRouter from "./routes/skills.route.js";
import personalDetailsRouter from "./routes/personalDetails.route.js";
import socialLinksRouter from "./routes/socialLinks.route.js";

const app = express();
const PORT = 3001;
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
connectDB();

app.get("/", (req, res) => {
  res.json({ msg: "Hello, World!" });
});

// app.use("/users", userRouter);
app.use("/api/auth", authRoutes);
app.use("/api/experience", experienceRouter);
app.use("/api/education", educationRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/personalDetails", personalDetailsRouter);
app.use("/api/socialLinks", socialLinksRouter);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
