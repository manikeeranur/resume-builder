import PersonalInfoForm from "./PersonalInfoForm";
import SummaryForm from "./SummaryForm";
import RepeatableSection from "./RepeatableSection";
import {
  emptyExperience,
  emptyProject,
  emptySkillGroup,
  emptyEducation,
  emptyCertification,
  emptyLanguage,
  emptyAchievement,
} from "@/lib/resumeDefaults";

export default function SectionForm({ sections, activeSection, updateSection }) {
  switch (activeSection) {
    case "personalInfo":
      return <PersonalInfoForm value={sections.personalInfo} onChange={(v) => updateSection("personalInfo", v)} />;
    case "summary":
      return <SummaryForm value={sections.summary} onChange={(v) => updateSection("summary", v)} />;
    case "experience":
      return (
        <RepeatableSection
          items={sections.experience}
          onChange={(v) => updateSection("experience", v)}
          emptyItem={emptyExperience}
          itemLabel={(it, i) => it.position || it.company || `Experience ${i + 1}`}
          fields={[
            { key: "position", label: "Position" },
            { key: "company", label: "Company" },
            { key: "location", label: "Location" },
            { key: "startDate", label: "Start Date" },
            { key: "endDate", label: "End Date" },
            { key: "current", label: "Currently working here", type: "checkbox" },
            { key: "technology", label: "Technology (e.g. React, Node.js)" },
            { key: "project", label: "Project Name" },
            {
              key: "description",
              label: "Description (one achievement per line)",
              type: "textarea",
              full: true,
            },
          ]}
        />
      );
    case "projects":
      return (
        <RepeatableSection
          items={sections.projects}
          onChange={(v) => updateSection("projects", v)}
          emptyItem={emptyProject}
          itemLabel={(it, i) => it.name || `Project ${i + 1}`}
          fields={[
            { key: "name", label: "Project Name" },
            { key: "link", label: "Link" },
            { key: "tech", label: "Tech Stack" },
            { key: "description", label: "Description", type: "textarea", full: true },
          ]}
        />
      );
    case "skills":
      return (
        <RepeatableSection
          items={sections.skills}
          onChange={(v) => updateSection("skills", v)}
          emptyItem={emptySkillGroup}
          itemLabel={(it, i) => it.category || `Skill Group ${i + 1}`}
          fields={[
            { key: "category", label: "Category (e.g. Frontend)" },
            { key: "items", label: "Skills (comma separated)", full: true },
          ]}
        />
      );
    case "education":
      return (
        <RepeatableSection
          items={sections.education}
          onChange={(v) => updateSection("education", v)}
          emptyItem={emptyEducation}
          itemLabel={(it, i) => it.degree || `Education ${i + 1}`}
          fields={[
            { key: "degree", label: "Degree" },
            { key: "field", label: "Field of Study" },
            { key: "institution", label: "Institution" },
            { key: "grade", label: "Grade" },
            { key: "startDate", label: "Start Date" },
            { key: "endDate", label: "End Date" },
          ]}
        />
      );
    case "certifications":
      return (
        <RepeatableSection
          items={sections.certifications}
          onChange={(v) => updateSection("certifications", v)}
          emptyItem={emptyCertification}
          itemLabel={(it, i) => it.name || `Certification ${i + 1}`}
          fields={[
            { key: "name", label: "Name" },
            { key: "issuer", label: "Issuer" },
            { key: "date", label: "Date" },
          ]}
        />
      );
    case "languages":
      return (
        <RepeatableSection
          items={sections.languages}
          onChange={(v) => updateSection("languages", v)}
          emptyItem={emptyLanguage}
          itemLabel={(it, i) => it.name || `Language ${i + 1}`}
          fields={[
            { key: "name", label: "Language" },
            { key: "level", label: "Proficiency" },
          ]}
        />
      );
    case "achievements":
      return (
        <RepeatableSection
          items={sections.achievements}
          onChange={(v) => updateSection("achievements", v)}
          emptyItem={emptyAchievement}
          itemLabel={(it, i) => it.title || `Achievement ${i + 1}`}
          fields={[
            { key: "title", label: "Title" },
            { key: "description", label: "Description", type: "textarea", full: true },
          ]}
        />
      );
    default:
      return null;
  }
}
