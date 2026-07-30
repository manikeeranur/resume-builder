import { defaultThemeConfig } from "@/lib/resumeDefaults";

// Demo content for Template 2's fallback preview (used only if the static
// thumbnail image at /templates/template-2.png fails to load).
export const sampleResume2 = {
  templateId: "template-2",
  themeConfig: { ...defaultThemeConfig, primaryColor: "#6d5ce8" },
  sections: {
    personalInfo: {
      fullName: "Vikash Sharma",
      title: "Frontend Developer",
      email: "vikash.sharma.dev@gmail.com",
      phone: "(+91) 91234 56789",
      location: "Noida, Uttar Pradesh, India",
      linkedin: "https://www.linkedin.com/in/vikash-sharma-dev",
      github: "https://github.com/vikash-sharma",
      portfolio: "https://www.vikashsharma.dev",
      photo: "",
      dateOfBirth: "12 August 1997",
    },
    summary:
      "Passionate Frontend Developer with 4+ years of experience building responsive, user-friendly web applications. Skilled in React.js, Next.js, TypeScript, and modern UI frameworks. Committed to delivering clean code, great user experiences, and scalable solutions.",
    experience: [
      {
        position: "Front-End Developer",
        company: "TechNova Solutions Pvt Ltd",
        location: "Noida, India",
        startDate: "Oct 2023",
        endDate: "",
        current: true,
        technology: "Next.js, TypeScript, Material-UI (MUI), SCSS",
        project: "E-Commerce Platform",
        description:
          "Led frontend development with Next.js, TypeScript, MUI, and Tailwind CSS, ensuring 99% cross-device responsiveness.\nBuilt interactive community features for networking and mentorship, boosting user retention by 25%.\nDeveloped a real-time resume builder with customizable templates, increasing user engagement by 30%.\nIntegrated skill-based job recommendations, improving application conversions by 20%.\nImplemented RESTful API integrations for job listings and company profiles, reducing data fetch time by 40%.\nOptimized global state management using Redux, decreasing unnecessary re-renders and improving app performance by 25%.",
      },
      {
        position: "Front-End Developer",
        company: "Elevate Digital Pvt Ltd",
        location: "Gurugram, India",
        startDate: "Aug 2021",
        endDate: "Sep 2023",
        current: false,
        technology: "HTML5, CSS3, React Js",
        project: "Corporate Website & Admin Dashboard",
        description:
          "Led frontend development for integrated freight forwarding solutions, contributing to a 30% improvement in user workflow efficiency.\nDeveloped high-performance web applications using React.js, achieving faster load times up to 40%.\nCollaborated closely with UI/UX teams to build modern, accessible interfaces ensuring WCAG compliance.\nIntegrated RESTful APIs and ensured mobile responsiveness, reducing support tickets by 25%.\nEnhanced component reusability and managed frontend tasks in logistics and cargo management projects.",
      },
    ],
    projects: [],
    skills: [
      { category: "Language", items: "JavaScript, TypeScript, HTML5, CSS3" },
      { category: "Frameworks & Libraries", items: "React Js, Next Js" },
      { category: "State Management", items: "Context API, Redux" },
      { category: "UI Libraries & Styling", items: "MUI, Tailwind CSS, Bootstrap, SCSS, ShadCN" },
      { category: "Version Control & CI/CD", items: "Git, GitHub, Bitbucket, Jenkins" },
      { category: "Tools & Platforms", items: "Postman, AWS S3, Jira" },
      { category: "Development Tools", items: "VS Code, Chrome DevTools" },
    ],
    education: [
      {
        degree: "Master of Computer Applications",
        field: "",
        institution: "Dayananda Sagar College of Engineering, Bengaluru",
        startDate: "2020",
        endDate: "2022",
        grade: "80%",
      },
      {
        degree: "Bachelor of Computer Applications",
        field: "",
        institution: "BMS College of Commerce & Management, Bengaluru",
        startDate: "2017",
        endDate: "2020",
        grade: "67.20%",
      },
      {
        degree: "Higher Secondary Certificate (HSC)",
        field: "",
        institution: "Sri Chaitanya Junior College, Bengaluru",
        startDate: "",
        endDate: "2017",
        grade: "69.50%",
      },
      {
        degree: "Secondary School Leaving Certificate (SSLC)",
        field: "",
        institution: "Kendriya Vidyalaya, Bengaluru",
        startDate: "",
        endDate: "2015",
        grade: "84.20%",
      },
    ],
    certifications: [],
    languages: [{ name: "Hindi", level: "Fluent" }, { name: "English", level: "Fluent" }],
    achievements: [
      { title: "Sincerity and Self-motivated, Self-analysis." },
      { title: "Hard work and Dedication." },
      { title: "Have a good communication with others." },
    ],
  },
};
