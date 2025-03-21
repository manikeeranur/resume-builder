import SocialLinksModel from "../models/socialLinks.model.js";

export const getSocialLinks = async (req, res) => {
  try {
    const data = await SocialLinksModel.find();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const postSocialLinks = async (req, res) => {
  try {
    const newSocialLinks = new SocialLinksModel(req.body);
    const savedSocialLinks = await newSocialLinks.save();
    return res.status(201).json(savedSocialLinks);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};



export const updateSocialLinks = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSocialLinks = await SocialLinksModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedSocialLinks) {
      return res.status(404).json({ message: "SocialLinks not found" });
    }

    return res.status(200).json(updatedSocialLinks);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteSocialLinks = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteSocialLinks = await SocialLinksModel.findByIdAndDelete(id);

    if (!deleteSocialLinks) {
      return res.status(404).json({ message: "SocialLinks not found" });
    }

    return res.status(200).json({ message: "SocialLinks deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
