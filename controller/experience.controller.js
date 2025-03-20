import ExperienceModel from "../models/experience.model.js";

export const getExperience = async (req, res) => {
  try {
    const data = await ExperienceModel.find();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const postExperience = async (req, res) => {
  try {
    const newExperience = new ExperienceModel(req.body);
    const savedExperience = await newExperience.save();
    return res.status(201).json(savedExperience);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
