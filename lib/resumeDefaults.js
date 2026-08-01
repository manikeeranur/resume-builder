export const emptyResumeSections = {
  personalInfo: {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
    photo: "",
    dateOfBirth: "",
  },
  summary: "",
  experience: [],
  projects: [],
  skills: [],
  education: [],
  certifications: [],
  languages: [],
  achievements: [],
};

export const defaultThemeConfig = {
  primaryColor: "#161616",
  font: "Inter",
  layout: "two-column",
  spacing: "comfortable",
};

export const THEME_COLORS = [
  { name: "Black", value: "#161616" },
  { name: "Slate", value: "#334155" },
  { name: "Navy", value: "#1e3a8a" },
  { name: "Blue", value: "#2563eb" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Cyan", value: "#0891b2" },
  { name: "Teal", value: "#0d9488" },
  { name: "Emerald", value: "#059669" },
  { name: "Green", value: "#16a34a" },
  { name: "Olive", value: "#4d7c0f" },
  { name: "Amber", value: "#d97706" },
  { name: "Orange", value: "#ea580c" },
  { name: "Red", value: "#dc2626" },
  { name: "Rose", value: "#e11d48" },
  { name: "Pink", value: "#db2777" },
  { name: "Purple", value: "#6d5ce8" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Brown", value: "#78350f" },
];

export const THEME_FONTS = ["Inter", "Poppins", "Roboto", "Merriweather", "Lora"];

export const SECTION_LIST = [
  { key: "personalInfo", label: "Personal Info" },
  { key: "summary", label: "Summary" },
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
  { key: "skills", label: "Skills" },
  { key: "education", label: "Education" },
  { key: "certifications", label: "Certifications" },
  { key: "languages", label: "Languages" },
  { key: "achievements", label: "Achievements" },
];

export const emptyExperience = () => ({
  company: "",
  position: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  technology: "",
  project: "",
  description: "",
});

export const emptyProject = () => ({
  name: "",
  description: "",
  tech: "",
  link: "",
});

export const emptySkillGroup = () => ({
  category: "",
  items: "",
});

export const emptyEducation = () => ({
  institution: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
  grade: "",
});

export const emptyCertification = () => ({
  name: "",
  issuer: "",
  date: "",
});

export const emptyLanguage = () => ({
  name: "",
  level: "Fluent",
});

export const emptyAchievement = () => ({
  title: "",
  description: "",
});
