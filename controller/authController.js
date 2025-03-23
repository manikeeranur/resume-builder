import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/users.js";
import ExperienceModel from "../models/experience.model.js";
import EducationModel from "../models/education.model.js";
import SkillsModel from "../models/skills.model.js";
import PersonalDetailsModel from "../models/personalDetails.model.js";
import SocialLinksModel from "../models/socialLinks.model.js";

const JWT_SECRET = process.env.JWT_SECRET;

// Signup
export const signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });

    await newUser.save();

    // Generate token
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const { password: _, ...userDetails } = user.toObject(); // Remove password from response

    res.status(200).json({ token, user: userDetails });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get User Details with all profile-related data
export const getUserDetails = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id)
      return res.status(400).json({ message: "User ID is required" });

    const user = await User.findOne({ user_id }).select("-password").lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch related data in parallel
    const [experience, education, skills, personalDetails, socialLinks] =
      await Promise.all([
        ExperienceModel.find({ user_id }).lean(),
        EducationModel.find({ user_id }).lean(),
        SkillsModel.find({ user_id }).lean(),
        PersonalDetailsModel.find({ user_id }).lean(),
        SocialLinksModel.find({ user_id }).lean(),
      ]);

    // Remove unnecessary fields
    const sanitizeData = (data) =>
      data.map(({ __v, user_id, ...rest }) => rest);

    res.json({
      message: "User profile fetched successfully",
      userDetails: {
        ...user,
        mobile: socialLinks.length > 0 ? socialLinks[0].whatsapp : null,
        experience: sanitizeData(experience),
        education: sanitizeData(education),
        skills: sanitizeData(skills),
        personalDetails: sanitizeData(personalDetails),
        socialLinks: sanitizeData(socialLinks),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get Profile of Authenticated User
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User profile fetched successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Token Validation Middleware
export const checkAuth = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ isValid: false, message: "No token provided" });

  try {
    if (!JWT_SECRET)
      throw new Error("JWT_SECRET is missing in environment variables.");

    jwt.verify(token, JWT_SECRET);
    res.status(200).json({ isValid: true });
  } catch (error) {
    res
      .status(403)
      .json({ isValid: false, message: "Invalid or expired token" });
  }
};
