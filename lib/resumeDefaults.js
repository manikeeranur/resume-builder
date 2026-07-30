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
  { name: "Purple", value: "#6d5ce8" },
  { name: "Blue", value: "#2563eb" },
  { name: "Teal", value: "#0d9488" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
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
