import { defaultThemeConfig } from "@/lib/resumeDefaults";

// Demo content for Template 6's fallback preview (used only if the static
// thumbnail image at /templates/template-6.png fails to load).
export const sampleResume6 = {
  templateId: "template-6",
  themeConfig: { ...defaultThemeConfig, primaryColor: "#2b8bc4" },
  sections: {
    personalInfo: {
      fullName: "Kate Bishop",
      title: "Product Designer",
      email: "kate.bishop@katedesign.com",
      phone: "+46 98-765 43 21",
      location: "",
      linkedin: "linkedin.com/in/kate-bishop",
      github: "",
      portfolio: "",
      photo: "",
      dateOfBirth: "",
    },
    summary:
      "Over 5 years of professional experience conducting UX research and designing interactive end-to-end user flows. I enjoy working in close collaboration with teams across technology, business and design.",
    experience: [
      {
        position: "Product Designer",
        company: "Fintef",
        location: "",
        startDate: "2019-10",
        endDate: "",
        current: true,
        technology: "",
        project: "",
        description:
          "Designing end-to-end experience for financial products on mobile & web platforms. Working closely with managers, marketing specialists and developers.",
      },
      {
        position: "UX Designer",
        company: "Resume Worded",
        location: "",
        startDate: "2017-09",
        endDate: "2019-09",
        current: false,
        technology: "",
        project: "",
        description:
          "Revamped website flows and navigation menus, reducing the frequency of misdirected customer service queries by 30%. Conducted user testing with 10+ participants using UserTesting.com; designed against findings which reduced bounce rate for primary user flow by 30%.",
      },
      {
        position: "Associate UX Designer",
        company: "Growshi",
        location: "",
        startDate: "2016-12",
        endDate: "2017-08",
        current: false,
        technology: "",
        project: "",
        description:
          "Redesigned company's homepage and lead generation forms using existing design system; reduced bounce rates by 40% and increased leads by 15%.\nDesigned online customer support center comprising of a self-service knowledge base and interactive chat bot. Coached 15 summer interns.",
      },
      {
        position: "UX Analyst",
        company: "Growshi",
        location: "",
        startDate: "2016-03",
        endDate: "2016-12",
        current: false,
        technology: "",
        project: "",
        description:
          "Managed redesign of internal tracking system in use by 125 employees, resulting in 20+ new features and 25% higher engagement.\nWorked with product managers to validate design hypothesis by conducting interviews and usability sessions.",
      },
    ],
    projects: [],
    skills: [
      {
        category: "",
        items:
          "Business Analysis, UX Research, User Testing and Validation, Customer Journey Mapping, Information Architecture, Low- and High-Fidelity Wireframing, Prototyping, Interaction Design, Visual Design, Defining Product Specifications, Design System Development, Design Sprints, A/B Testing",
      },
      { category: "", items: "Experienced with Kanban, Agile & Lean methodologies" },
      { category: "Coding fundamentals", items: "HTML, CSS, JavaScript, SQL" },
    ],
    education: [
      {
        degree: "Master's",
        field: "Human-Computer Interaction",
        institution: "Copenhagen School of Design and Technology",
        startDate: "2015",
        endDate: "2016",
        grade: "",
      },
      {
        degree: "Bachelor's of Arts",
        field: "",
        institution: "Copenhagen School of Design and Technology",
        startDate: "2011",
        endDate: "2015",
        grade: "",
      },
    ],
    certifications: [
      { name: "Design Leadership Masterclass", issuer: "Design Lab Inc.", date: "2020-03" },
      { name: "UX: Interaction Design", issuer: "Trydesignlab.com", date: "2017-12" },
      { name: "UX Design Specialization", issuer: "Udacity.com, online course by Google", date: "2016-08" },
      { name: "Branding fundamentals", issuer: "Design Lab Inc.", date: "2014-11" },
    ],
    languages: [],
    achievements: [],
  },
};
