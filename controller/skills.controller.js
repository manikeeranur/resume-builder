import SkillsModel from "../models/skills.model.js";

export const getSkills = async (req, res) => {
  try {
    const data = await SkillsModel.find();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const postSkills = async (req, res) => {
  try {
    const newSkills = new SkillsModel(req.body);
    const savedSkills = await newSkills.save();
    return res.status(201).json(savedSkills);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
