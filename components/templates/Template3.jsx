import { Mail, Phone } from "lucide-react";
import { IconBrandLinkedin } from "@tabler/icons-react";
import {
  dateRange,
  formatFullDate,
  formatMonthYear,
  skillItems,
  themeVars,
} from "./helpers";
import { totalExperienceDuration } from "@/lib/experienceDuration";

const ACCENT = "#1696bf";
const MUTED = "#8d8d8d";
const INK = "#111111";

function SectionHeading({ children }) {
  return (
    <div
      className="mb-[16px] text-[20px] font-medium leading-none"
      style={{ color: "var(--resume-primary, #1696bf)" }}
    >
      {children}
    </div>
  );
}

function EntryTitle({ children }) {
  return (
    <div className="!text-[16px] font-bold leading-[1.15] text-[#111111]">
      {children}
    </div>
  );
}

function BodyText({ children, className = "" }) {
  return (
    <div className={`text-[14px] leading-[1.42] text-[#171717] ${className}`}>
      {children}
    </div>
  );
}

// Each sentence becomes its own bullet — split strictly on ". " (a bare
// line break alone doesn't start a new bullet).
function splitBullets(text) {
  return (text || "")
    .replace(/\n/g, " ")
    .split(/\.\s+/)
    .map((l) => l.trim().replace(/\.$/, ""))
    .filter(Boolean)
    .map((l) => `${l}.`);
}

export default function Template3({ resume }) {
  const { sections, themeConfig } = resume;
  const pi = sections.personalInfo || {};
  const duration = totalExperienceDuration(sections.experience);
  const stacked = themeConfig?.layout === "single";

  const experiences = sections.experience || [];
  const education = sections.education || [];
  const certifications = sections.certifications || [];
  const skills = sections.skills || [];
  const languages = sections.languages || [];

  const combinedSkills = skills
    .flatMap((group) => skillItems(group.items))
    .filter(Boolean)
    .join(", ");

  const languageNames = languages
    .map((item) => item.name)
    .filter(Boolean)
    .join(", ");

  const summary =
    sections.summary ||
    (duration
      ? `Over ${duration} of professional experience. I enjoy working in close collaboration with teams across technology, business and design.`
      : "Professional with experience collaborating across technology, business and design.");

  return (
    <div
      id="resume-content"
      className="mx-auto w-[850px] overflow-hidden bg-white text-[#171717]"
      style={{
        fontFamily: "'Poppins', 'Avenir Next', 'Segoe UI', sans-serif",
        ...themeVars(themeConfig),
        "--resume-primary": themeConfig?.primaryColor || ACCENT,
      }}
    >
      <div className="bg-[#eef9fc] p-[32px]">
        <div
          className={`grid gap-[35px] ${stacked ? "grid-cols-1" : "grid-cols-[1.55fr_0.95fr]"}`}
        >
          <div>
            <div className="flex items-center gap-[22px]">
              {pi.photo && pi.showPhoto !== false && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pi.photo}
                  alt={pi.fullName || "Profile"}
                  className="h-[90px] w-[90px] shrink-0 rounded-full border-[4px] border-gray-200 object-cover"
                />
              )}

              <div className="min-w-0">
                <div className="text-[24px] font-bold leading-[1.03] tracking-[-1.2px] text-black">
                  {pi.fullName || "Your Name"}
                </div>
                <div
                  className="mt-[10px] text-[20px] font-semibold leading-none"
                  style={{ color: "var(--resume-primary)" }}
                >
                  {pi.title || "Your Title"}
                </div>
              </div>
            </div>

            <BodyText className="mt-4 max-w-[540px] text-[14px] leading-[1.43]">
              {summary}
            </BodyText>
          </div>

          <div className="space-y-2 pt-[7px]">
            {pi.email && (
              <div>
                <div className="flex items-center gap-2">
                  <Mail size={16} style={{ color: "var(--resume-primary)" }} />
                  <div
                    className="text-[14px] font-medium"
                    style={{ color: "var(--resume-primary)" }}
                  >
                    Email
                  </div>
                </div>
                <a
                  href={`mailto:${pi.email}`}
                  className="mt-[2px] block break-all text-[14px] text-black decoration-[1.5px] no-underline"
                >
                  {pi.email}
                </a>
              </div>
            )}

            {pi.linkedin && (
              <div>
                <div className="flex items-center gap-2">
                  <IconBrandLinkedin
                    size={16}
                    style={{ color: "var(--resume-primary)" }}
                  />
                  <div
                    className="text-[14px] font-medium"
                    style={{ color: "var(--resume-primary)" }}
                  >
                    LinkedIn
                  </div>
                </div>
                <a
                  href={pi.linkedin}
                  className="mt-[2px] block break-all text-[14px] text-black decoration-[1.5px] no-underline"
                >
                  {pi.linkedin.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}

            {pi.phone && (
              <div>
                <div className="flex items-center gap-2">
                  <Phone size={16} style={{ color: "var(--resume-primary)" }} />
                  <div
                    className="text-[14px] font-medium"
                    style={{ color: "var(--resume-primary)" }}
                  >
                    Phone
                  </div>
                </div>
                <a
                  href={`tel:${pi.phone}`}
                  className="mt-[2px] block break-all text-[14px] text-black decoration-[1.5px] no-underline"
                >
                  {pi.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <main
        className={`p-[32px] ${
          stacked
            ? "grid grid-cols-1 gap-[34px]"
            : "grid grid-cols-[1fr_0.96fr] gap-[34px]"
        }`}
      >
        <section>
          <SectionHeading>Work experience</SectionHeading>

          <div className="space-y-[24px]">
            {experiences.map((exp, index) => (
              <article key={index}>
                <EntryTitle>{exp.position}</EntryTitle>
                <BodyText className="mt-1">
                  {[
                    exp.company,
                    dateRange(exp.startDate, exp.endDate, exp.current),
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </BodyText>

                {(exp.description || exp.project || exp.technology) && (
                  <div className="mt-2 space-y-[8px]">
                    {exp.description && (
                      <>
                        {exp.project && <BodyText>Project : {exp.project}</BodyText>}
                        {/* <ul className="list-disc pl-5 space-y-1 marker:text-gray-400">
                          {splitBullets(exp.description).map((line, index) => (
                            <li key={index}>
                              <BodyText>{line}</BodyText>
                            </li>
                          ))}
                        </ul> */}
                              <BodyText className="text-gray-500">{exp.description}</BodyText>

                      </>
                    )}
                    {!exp.description && exp.project && (
                      <BodyText>{exp.project}</BodyText>
                    )}
                    {!exp.description && exp.technology && (
                      <BodyText>{exp.technology}</BodyText>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading>Education &amp; Learning</SectionHeading>

          <div className="space-y-[22px]">
            {education.map((ed, index) => (
              <article key={`edu-${index}`}>
                <EntryTitle>{ed.degree}</EntryTitle>
                <BodyText className="mt-1">
                  {[ed.institution, dateRange(ed.startDate, ed.endDate)]
                    .filter(Boolean)
                    .join(", ")}
                </BodyText>
              </article>
            ))}

            {certifications.map((cert, index) => (
              <article key={`cert-${index}`}>
                <EntryTitle>{cert.name}</EntryTitle>
                <BodyText className="mt-1">
                  {[cert.issuer, formatMonthYear(cert.date)]
                    .filter(Boolean)
                    .join(", ")}
                </BodyText>
              </article>
            ))}
          </div>

          {(combinedSkills ||
            languageNames ||
            pi.dateOfBirth ||
            pi.location) && (
            <div className="mt-[28px]">
              <SectionHeading>Skills</SectionHeading>

              <div className="space-y-[14px]">
                {combinedSkills && <BodyText>{combinedSkills}.</BodyText>}

                {languageNames && (
                  <BodyText>Languages: {languageNames}.</BodyText>
                )}

                {(pi.location || pi.dateOfBirth) && (
                  <BodyText>
                    {[
                      pi.location,
                      pi.dateOfBirth && formatFullDate(pi.dateOfBirth),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </BodyText>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
