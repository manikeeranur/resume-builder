import PersonalDetailsModel from "../models/personalDetails.model.js";

export const getPersonalDetails = async (req, res) => {
  try {
    const data = await PersonalDetailsModel.find();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const postPersonalDetails = async (req, res) => {
  try {
    const newPersonalDetails = new PersonalDetailsModel(req.body);
    const savedPersonalDetails = await newPersonalDetails.save();
    return res.status(201).json(savedPersonalDetails);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
