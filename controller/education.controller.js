import EducationModel from "../models/education.model.js";

export const getEducation = async (req, res) => {
  try {
    const data = await EducationModel.find();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const postEducation = async (req, res) => {
  try {
    const newEducation = new EducationModel(req.body);
    const savedEducation = await newEducation.save();
    return res.status(201).json(savedEducation);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEducation = await EducationModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedEducation) {
      return res.status(404).json({ message: "Education not found" });
    }

    return res.status(200).json(updatedEducation);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteEducation = await EducationModel.findByIdAndDelete(id);

    if (!deleteEducation) {
      return res.status(404).json({ message: "Education not found" });
    }

    return res.status(200).json({ message: "Education deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
