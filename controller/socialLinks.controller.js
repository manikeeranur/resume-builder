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
