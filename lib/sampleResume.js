import { defaultThemeConfig } from "@/lib/resumeDefaults";

// Demo content used to render the live template preview thumbnails on the
// Template Gallery — keeps the cards in sync with the real templates forever
// instead of going stale like static screenshots would.
export const sampleResume = {
  templateId: "template-1",
  themeConfig: defaultThemeConfig,
  sections: {
    personalInfo: {
      fullName: "Veronica Harrison",
      title: "Graphic Designer",
      email: "veronicaharr@gmail.com",
      phone: "+1 273 931 3743",
      location: "Los Angeles, CA, 92383",
      linkedin: "linkedin.com/in/veronika-harrison",
      github: "github.com/veronicaharr",
      portfolio: "veronicaharrison.design",
      photo: "",
    },
    summary:
      "Graphic designer with +8 years of experience in branding and print design. Skilled at Adobe Creative Suite (Photoshop, Illustrator, InDesign) as well as sketching and hand drawing.",
    experience: [
      {
        position: "UI Designer",
        company: "Market Studios",
        location: "Los Angeles",
        startDate: "Oct 2012",
        endDate: "Sep 2015",
        current: false,
        technology: "Figma, Adobe XD, Illustrator",
        project: "Northwind Rebrand",
        description:
          "Successfully translated subject matter into concrete design for newsletters, promotional materials and sales collateral.\nCreated design graphics for marketing and sales presentations, training videos and corporate websites.",
      },
      {
        position: "Graphic Designer",
        company: "FireWeb",
        location: "San Francisco",
        startDate: "Oct 2015",
        endDate: "Jan 2018",
        current: false,
        technology: "Photoshop, InDesign, Premiere Pro",
        project: "FireWeb Marketing Suite",
        description:
          "Created new design themes for marketing and collateral materials.\nCollaborated with the creative team to produce computer-generated artwork for promotional campaigns.",
      },
    ],
    projects: [],
    skills: [{ category: "", items: "Figma, Sketch, Adobe Photoshop, Adobe Illustrator, Premiere Pro, After Effects" }],
    education: [
      {
        degree: "Bachelor of Fine Arts",
        field: "Graphic Design",
        institution: "Iowa University",
        startDate: "Nov 2005",
        endDate: "Sep 2010",
        grade: "GPA: 3.4/4.0",
      },
      {
        degree: "Master of Graphic Design",
        field: "",
        institution: "Iowa University",
        startDate: "Aug 2010",
        endDate: "Sep 2012",
        grade: "GPA: 3.8/4.0",
      },
    ],
    certifications: [],
    languages: [{ name: "English", level: "Fluent" }],
    achievements: [{ title: "Self-motivated and detail-oriented, with strong self-analysis skills." }],
  },
};
