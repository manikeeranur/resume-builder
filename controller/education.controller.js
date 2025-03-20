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
