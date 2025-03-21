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

export const updatePersonalDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPersonalDetails = await PersonalDetailsModel.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
      }
    );

    if (!updatedPersonalDetails) {
      return res.status(404).json({ message: "PersonalDetails not found" });
    }

    return res.status(200).json(updatedPersonalDetails);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deletePersonalDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const deletePersonalDetails = await PersonalDetailsModel.findByIdAndDelete(
      id
    );

    if (!deletePersonalDetails) {
      return res.status(404).json({ message: "PersonalDetails not found" });
    }

    return res
      .status(200)
      .json({ message: "PersonalDetails deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
