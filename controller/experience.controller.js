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

export const updateExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedExperience = await ExperienceModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedExperience) {
      return res.status(404).json({ message: "Experience not found" });
    }

    return res.status(200).json(updatedExperience);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedExperience = await ExperienceModel.findByIdAndDelete(id);

    if (!deletedExperience) {
      return res.status(404).json({ message: "Experience not found" });
    }

    return res.status(200).json({ message: "Experience deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
