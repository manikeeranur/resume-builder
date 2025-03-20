import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/users.js";
import ExperienceModel from "../models/experience.model.js";
import EducationModel from "../models/education.model.js";
import SkillsModel from "../models/skills.model.js";
import PersonalDetailsModel from "../models/personalDetails.model.js";
import SocialLinksModel from "../models/socialLinks.model.js";

export const signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });

    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const userDetails = user.toObject();
    delete userDetails.password;

    res.status(200).json({ token, userDetails });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(user_id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const experience = await ExperienceModel.find({
      user_id: user.user_id,
    }).lean();

    const education = await EducationModel.find({
      user_id: user.user_id,
    }).lean();

    const skills = await SkillsModel.find({
      user_id: user.user_id,
    }).lean();

    const personalDetails = await PersonalDetailsModel.find({
      user_id: user.user_id,
    }).lean();

    const socialLinks = await SocialLinksModel.find({
      user_id: user.user_id,
    }).lean();

    const sanitizedExperience = experience.map(
      ({ user_id, __v, ...rest }) => rest
    );
    const sanitizedEducation = education.map(
      ({ user_id, __v, ...rest }) => rest
    );

    const sanitizedSkills = skills.map(({ user_id, __v, ...rest }) => rest);

    const sanitizedPersonalDetails = personalDetails.map(
      ({ user_id, __v, ...rest }) => rest
    );

    const sanitizedSocialLinks = socialLinks.map(
      ({ user_id, __v, ...rest }) => rest
    );

    const userDetails = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      mobile: socialLinks.length > 0 ? socialLinks[0].whatsapp : null,
      experience: sanitizedExperience,
      education: sanitizedEducation,
      skills: sanitizedSkills,
      personalDetails: sanitizedPersonalDetails,
      socialLinks: sanitizedSocialLinks,
    };

    res.json({
      message: "User profile fetched successfully",
      userDetails,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
