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

export const updateSkills = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSkills = await SkillsModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedSkills) {
      return res.status(404).json({ message: "Skills not found" });
    }

    return res.status(200).json(updatedSkills);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteSkills = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteSkills = await SkillsModel.findByIdAndDelete(id);

    if (!deleteSkills) {
      return res.status(404).json({ message: "Skills not found" });
    }

    return res.status(200).json({ message: "Skills deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
