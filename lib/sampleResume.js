import { defaultThemeConfig } from "@/lib/resumeDefaults";

// A generic avatar (gradient circle + person silhouette) as an inline SVG
// data URI — no separate image file to host, and it renders offline in the
// admin PDF preview's Puppeteer pipeline with no network fetch to wait on.
// Templates crop it with rounded-full/object-cover, so this only needs to
// look right once cropped circular.
const DUMMY_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8a7cf0"/>
      <stop offset="1" stop-color="#6d5ce8"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#g)"/>
  <circle cx="100" cy="78" r="38" fill="#ffffff" fill-opacity="0.92"/>
  <path d="M100 128c-44 0-70 24-70 55v17h140v-17c0-31-26-55-70-55z" fill="#ffffff" fill-opacity="0.92"/>
</svg>`;
export const DUMMY_AVATAR = `data:image/svg+xml,${encodeURIComponent(DUMMY_AVATAR_SVG)}`;

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
      photo: DUMMY_AVATAR,
      showPhoto: true,
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
