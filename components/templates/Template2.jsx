import { Mail, Phone } from "lucide-react";
import { IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react";
import { skillItems, dateRange, themeVars, formatMonthYear, formatFullDate } from "./helpers";
import { totalExperienceDuration } from "@/lib/experienceDuration";

function Bullet() {
  return (
    <span className="mr-2 mt-[3px] shrink-0 text-[9px] leading-none" style={{ color: "var(--resume-primary)" }}>
      ▸
    </span>
  );
}

function SectionHeading({ children }) {
  return (
    <h2
      className="mb-3 text-[15px] font-extrabold uppercase tracking-wide"
      style={{ color: "var(--resume-primary)" }}
    >
      {children}
    </h2>
  );
}

export default function Template2({ resume }) {
  const { sections, themeConfig } = resume;
  const pi = sections.personalInfo || {};

  const duration = totalExperienceDuration(sections.experience);
  const contactRows = [
    pi.email && { icon: Mail, value: pi.email },
    pi.phone && { icon: Phone, value: pi.phone },
    pi.github && { icon: IconBrandGithub, value: pi.github },
    pi.linkedin && { icon: IconBrandLinkedin, value: pi.linkedin },
  ].filter(Boolean);

  const languageNames = (sections.languages || []).map((l) => l.name).filter(Boolean).join(", ");
  const links = [pi.portfolio, pi.github].filter(Boolean);

  // Project Details prefers each job's linked Project/Description; if none
  // of the experience entries have that filled in, fall back to the
  // standalone Projects section so that data isn't silently dropped.
  const experienceProjects = (sections.experience || [])
    .filter((exp) => exp.project && exp.description)
    .map((exp) => ({
      name: exp.project,
      bullets: exp.description.split("\n").map((l) => l.trim()).filter(Boolean),
    }));
  const projectItems =
    experienceProjects.length > 0
      ? experienceProjects
      : (sections.projects || [])
          .filter((p) => p.name)
          .map((p) => ({
            name: p.name,
            bullets: [p.description, p.tech && `Technologies: ${p.tech}`].filter(Boolean),
          }));

  const workExperience = sections.experience?.length > 0 && (
    <div>
      <SectionHeading>Work Experience</SectionHeading>
      <div className="space-y-4">
        {sections.experience.map((exp, i) => (
          <div key={i} className="flex">
            <Bullet />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-[#1c1c28]">{exp.position}</p>
              <p className="text-[12px] text-[#6b6b78]">{[exp.company, exp.location].filter(Boolean).join(" - ")}</p>
              <p className="text-[11.5px] text-[#8a8a99]">{dateRange(exp.startDate, exp.endDate, exp.current)}</p>
              {exp.technology && (
                <p className="mt-1 text-[11.5px] text-[#5a5a68]">
                  <span className="font-semibold">Technology</span> : {exp.technology}
                </p>
              )}
              {exp.project && (
                <p className="text-[11.5px] text-[#5a5a68]">
                  <span className="font-semibold">Project</span> : {exp.project}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const technicalSkills = sections.skills?.length > 0 && (
    <div>
      <SectionHeading>Technical Skills</SectionHeading>
      <div className="space-y-2">
        {sections.skills.map((g, i) => (
          <div key={i} className="flex">
            <Bullet />
            <p className="text-[12px] leading-relaxed text-[#3f3f4a]">
              {g.category && <span className="font-bold">{g.category} : </span>}
              <span className="text-[#5a5a68]">{skillItems(g.items).join(", ")}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const projectDetails = projectItems.length > 0 && (
    <div>
      <SectionHeading>Project Details</SectionHeading>
      <div className="space-y-4">
        {projectItems.map((proj, i) => (
          <div key={i}>
            <p className="mb-1.5 text-[12.5px] font-bold text-[#1c1c28]">{proj.name}</p>
            <ul className="space-y-1 pl-1">
              {proj.bullets.map((line, j) => (
                <li key={j} className="flex text-[12px] leading-relaxed text-[#5a5a68]">
                  <span className="mr-2 mt-1.5 h-[3px] w-[3px] shrink-0 rounded-full bg-[#8a8a99]" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  const education = sections.education?.length > 0 && (
    <div>
      <SectionHeading>Education</SectionHeading>
      <div className="space-y-3">
        {sections.education.map((ed, i) => (
          <div key={i} className="flex">
            <Bullet />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[12.5px] font-bold text-[#1c1c28]">
                  {ed.degree}
                  {ed.grade ? ` ${ed.grade}` : ""}
                </p>
                <span className="shrink-0 text-[11px] text-[#8a8a99]">{dateRange(ed.startDate, ed.endDate)}</span>
              </div>
              <p className="text-[11.5px] text-[#6b6b78]">{ed.institution}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const strength = sections.achievements?.length > 0 && (
    <div>
      <SectionHeading>Strength</SectionHeading>
      <div className="space-y-1.5">
        {sections.achievements.map((a, i) => (
          <div key={i} className="flex">
            <Bullet />
            <p className="text-[12px] leading-relaxed text-[#5a5a68]">{a.title}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const personalDetails = (pi.portfolio || languageNames || pi.dateOfBirth || pi.location) && (
    <div>
      <SectionHeading>Personal Details</SectionHeading>
      <div className="space-y-1.5">
        {pi.portfolio && (
          <div className="flex">
            <Bullet />
            <p className="text-[12px] text-[#5a5a68]">
              <span className="font-bold text-[#1c1c28]">Portfolio</span> : {pi.portfolio}
            </p>
          </div>
        )}
        {languageNames && (
          <div className="flex">
            <Bullet />
            <p className="text-[12px] text-[#5a5a68]">
              <span className="font-bold text-[#1c1c28]">Language Known</span> : {languageNames}
            </p>
          </div>
        )}
        {pi.dateOfBirth && (
          <div className="flex">
            <Bullet />
            <p className="text-[12px] text-[#5a5a68]">
              <span className="font-bold text-[#1c1c28]">Date of Birth</span> : {formatFullDate(pi.dateOfBirth)}
            </p>
          </div>
        )}
        {pi.location && (
          <div className="flex">
            <Bullet />
            <p className="text-[12px] text-[#5a5a68]">
              <span className="font-bold text-[#1c1c28]">Location</span> : {pi.location}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const linksSection = links.length > 0 && (
    <div>
      <SectionHeading>Links</SectionHeading>
      <div className="space-y-1.5">
        {links.map((link, i) => (
          <div key={i} className="flex">
            <Bullet />
            <p className="truncate text-[12px] text-[#5a5a68]">{link}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const certifications = sections.certifications?.length > 0 && (
    <div>
      <SectionHeading>Certifications</SectionHeading>
      <div className="space-y-1.5">
        {sections.certifications.map((c, i) => (
          <div key={i} className="flex">
            <Bullet />
            <p className="text-[12px] text-[#5a5a68]">{[c.name, c.issuer, formatMonthYear(c.date)].filter(Boolean).join(" — ")}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const declaration = (
    <div>
      <SectionHeading>Declaration</SectionHeading>
      <p className="text-[11.5px] leading-relaxed text-[#5a5a68]">
        I hereby declare that the above mentioned information is true to the best of my knowledge and I bear the
        responsibility for the comments of the above mentioned particulars.
      </p>
      <div className="mt-6 flex items-center justify-between text-[12px] text-[#3f3f4a]">
        <span>Date:</span>
        {pi.fullName && <span>( {pi.fullName.toUpperCase()} )</span>}
      </div>
    </div>
  );

  const stacked = themeConfig?.layout === "single";

  return (
    <div
      id="resume-content"
      className="mx-auto w-[850px] bg-white text-[#4b4b55]"
      style={{ fontFamily: "Inter, 'Segoe UI', sans-serif", ...themeVars(themeConfig) }}
    >
      <div className="flex items-start gap-5">
        {pi.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pi.photo} alt={pi.fullName} className="h-[140px] w-[140px] shrink-0 rounded-full object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-bold leading-tight text-[#1c1c28]">{pi.fullName || "Your Name"}</h1>
          <p className="mt-0.5 text-[15px] font-medium text-[#8a8a99]">{pi.title || "Your Title"}</p>
          {duration && (
            <p className="mt-2 text-[13px] font-bold text-[#33333f]">
              {duration} of Professional relevant experience.
            </p>
          )}
          {sections.summary && <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#5a5a68]">{sections.summary}</p>}
        </div>
      </div>

      {contactRows.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-b border-t border-[#ececf2] bg-[#f1f1f1] px-2.5 py-1 text-[11.5px] text-[#5a5a68]">
          {contactRows.map((row, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <row.icon size={13} style={{ color: "var(--resume-primary)" }} />
              {row.value}
            </span>
          ))}
        </div>
      )}

      <div className={`mt-6 flex gap-10 ${stacked ? "flex-col" : ""}`}>
        <div className="flex flex-1 flex-col gap-7">
          {workExperience}
          {projectDetails}
        </div>
        <div className="flex flex-1 flex-col gap-7">
          {technicalSkills}
          {education}
          {strength}
          {personalDetails}
          {linksSection}
          {certifications}
        </div>
      </div>

      <div className="mt-7">{declaration}</div>
    </div>
  );
}
