import { defaultThemeConfig } from "@/lib/resumeDefaults";

// Demo content for Template 4's fallback preview (used only if the static
// thumbnail image at /templates/template-4.png fails to load).
export const sampleResume4 = {
  templateId: "template-4",
  themeConfig: { ...defaultThemeConfig, primaryColor: "#1a5f4f" },
  sections: {
    personalInfo: {
      fullName: "Rick Tang",
      title: "Product Designer",
      email: "ricktang@gmail.com",
      phone: "(315) 802-8179",
      location: "San Francisco, California",
      linkedin: "https://linkedin.com/in/ricktang",
      github: "",
      portfolio: "https://dribbble.com/ricktang",
      photo: "",
    },
    summary:
      "I'm a product designer focused on ensuring great user experience and meeting business needs of designed products. I'm also experienced in implementing marketing strategies and developing both on and offline campaigns. My philosophy is to make products understandable, useful and long-lasting at the same time recognizing they're never finished and constantly changing.",
    experience: [
      {
        position: "Product Designer",
        company: "Uber",
        startDate: "2015-03",
        current: true,
        description:
          "Designed safety-focused experiences for Riders and Drivers. Physical space problem solving and it's interaction with the digital. Navigated organization to achieve operational improvements",
      },
      {
        position: "Product Designer",
        company: "IFTTT",
        startDate: "2013-12",
        endDate: "2015-03",
        description:
          "Product and system design for a complex product. Designed both consumer and developer products for IFTTT. Responsible for maintaining design across iOS, Android, and web",
      },
      {
        position: "Product Designer",
        company: "Facebook",
        startDate: "2013-06",
        endDate: "2013-09",
        description:
          "Designer and prototyped internal tools. Worked with Privacy team to build assets and features. Redesigned Newsfeed curation experience for mobile",
      },
    ],
    projects: [],
    skills: [
      { category: "", items: "Figma, Sketch, Adobe Photoshop, Adobe Illustrator, Principle, Adobe XD" },
    ],
    education: [
      {
        degree: "Interdisciplinary studies",
        field: "Interdisciplinary studies",
        institution: "Brown University",
        startDate: "2010-09",
        endDate: "2013-05",
      },
    ],
    certifications: [],
    languages: [{ name: "English", level: "" }, { name: "Italian", level: "" }],
    achievements: [],
  },
};
