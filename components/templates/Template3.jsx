import { Mail, Phone } from "lucide-react";
import { IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react";
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
    <div
      className={`text-[14px] leading-[1.42] text-[#171717] ${className}`}
      style={{ letterSpacing: "0.5px" }}
    >
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

            {pi.github && (
              <div>
                <div className="flex items-center gap-2">
                  <IconBrandGithub
                    size={16}
                    style={{ color: "var(--resume-primary)" }}
                  />
                  <div
                    className="text-[14px] font-medium"
                    style={{ color: "var(--resume-primary)" }}
                  >
                    GitHub
                  </div>
                </div>
                <a
                  href={pi.github}
                  className="mt-[2px] block break-all text-[14px] text-black decoration-[1.5px] no-underline"
                >
                  {pi.github.replace(/^https?:\/\//, "")}
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
          </div>
        </div>
      </div>

      {/* Single flowing column set: content fills the left column top to
          bottom first and only spills into the right column once the left
          one is full, instead of two independently-positioned grid tracks.
          break-inside-avoid on each entry stops a job/education/cert block
          from being sliced in half at the column (or print page) boundary;
          break-after-avoid keeps a heading glued to whatever follows it. */}
      <main
        className={`p-[32px] ${stacked ? "" : "columns-2 gap-x-[34px]"}`}
      >
        <div className="break-after-avoid">
          <SectionHeading>Work Experience</SectionHeading>
        </div>

        <div className="space-y-[24px]">
          {experiences.map((exp, index) => (
            <article key={index} className="break-inside-avoid">
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

        <div className="mt-[34px] break-after-avoid">
          <SectionHeading>Education &amp; Learning</SectionHeading>
        </div>

        <div className="space-y-[22px]">
          {education.map((ed, index) => (
            <article key={`edu-${index}`} className="break-inside-avoid">
              <EntryTitle>{ed.degree}</EntryTitle>
              {ed.institution && (
                <BodyText className="mt-1">{ed.institution}</BodyText>
              )}
              {dateRange(ed.startDate, ed.endDate) && (
                <BodyText className="text-[12px] text-gray-500">
                  {dateRange(ed.startDate, ed.endDate)}
                </BodyText>
              )}
            </article>
          ))}

          {certifications.map((cert, index) => (
            <article key={`cert-${index}`} className="break-inside-avoid">
              <EntryTitle>{cert.name}</EntryTitle>
              <BodyText className="mt-1">
                {[cert.issuer, formatMonthYear(cert.date)]
                  .filter(Boolean)
                  .join(", ")}
              </BodyText>
            </article>
          ))}
        </div>

        {combinedSkills && (
          <div className="mt-[28px] break-inside-avoid">
            <SectionHeading>Skills</SectionHeading>

            <div className="space-y-[14px]">
              <BodyText>{combinedSkills}.</BodyText>
            </div>
          </div>
        )}

        {(pi.location ||
          languageNames ||
          pi.portfolio ||
          pi.dateOfBirth) && (
          <div className="mt-[28px] break-inside-avoid">
            <SectionHeading>Personal Details</SectionHeading>

            <div className="space-y-[14px]">
              {pi.location && <BodyText>Location: {pi.location}.</BodyText>}

              {languageNames && (
                <BodyText>Languages: {languageNames}.</BodyText>
              )}

              {pi.dateOfBirth && (
                <BodyText>
                  Date of Birth: {formatFullDate(pi.dateOfBirth)}.
                </BodyText>
              )}

               {pi.portfolio && (
                <BodyText>
                  Portfolio:{" "}
                  {pi.portfolio.replace(/^https?:\/\//, "")}
                </BodyText>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
