import { skillItems, dateRange, themeVars } from "./helpers";

export default function Template1({ resume }) {
  const { sections, themeConfig } = resume;
  const pi = sections.personalInfo || {};
  const nameParts = (pi.fullName || "Your Name").trim().split(/\s+/);
  const firstLine = nameParts[0] || "Your";
  const secondLine = nameParts.slice(1).join(" ") || "Name";

  const flatSkills = (sections.skills || []).flatMap((g) => skillItems(g.items));

  const contactRows = [
    pi.phone && { label: "Tel", value: pi.phone },
    pi.email && { label: "Email", value: pi.email },
    pi.location && { label: "Location", value: pi.location },
    pi.linkedin && { label: "LinkedIn", value: pi.linkedin },
    pi.github && { label: "GitHub", value: pi.github },
    pi.portfolio && { label: "Portfolio", value: pi.portfolio },
  ].filter(Boolean);

  return (
    <div
      id="resume-content"
      className="mx-auto w-[850px] bg-white text-[#4b4b4b]"
      style={{ fontFamily: "'Space Grotesk', sans-serif", ...themeVars(themeConfig) }}
    >
      <div className="flex items-start gap-8">
        {pi.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pi.photo}
            alt={pi.fullName}
            className="h-28 w-28 shrink-0 rounded-full object-cover grayscale"
          />
        )}
        <div className="min-w-0">
          <h1 style={{ fontWeight: 800 }} className="text-[46px] leading-[0.98] tracking-tight text-[#161616]">
            {firstLine}
            <br />
            {secondLine}
          </h1>
          <p className="mt-3 text-[13px] font-medium uppercase tracking-[0.25em] text-[#8a8a8a]">
            {pi.title || "Your Title"}
          </p>
        </div>
      </div>

      <div className={`mt-14 flex gap-14 ${themeConfig?.layout === "single" ? "flex-col" : ""}`}>
        <div className="flex flex-1 flex-col" style={{ gap: "var(--resume-section-gap, 2.5rem)" }}>
          {sections.summary && (
            <Section title="Profile">
              <p className="text-[14px] leading-[1.8] text-[#6b6b6b]">{sections.summary}</p>
            </Section>
          )}

          {flatSkills.length > 0 && (
            <Section title="Main Skills">
              <ul className="space-y-2.5">
                {flatSkills.map((s, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-[14px] text-[#4b4b4b]">
                    <span className="h-[7px] w-[7px] shrink-0" style={{ background: "var(--resume-primary)" }} />
                    {s}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {sections.projects?.length > 0 && (
            <Section title="Projects">
              <div className="space-y-5">
                {sections.projects.map((p, i) => (
                  <div key={i}>
                    <p style={{ fontWeight: 700 }} className="text-[15px] text-[#161616]">
                      {p.name}
                    </p>
                    {p.description && <p className="mt-1.5 text-[14px] leading-[1.8] text-[#6b6b6b]">{p.description}</p>}
                    {p.tech && <p className="mt-1 text-[13px] text-[#a0a0a0]">{p.tech}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {contactRows.length > 0 && (
            <Section title="Contact Information">
              <div className="space-y-2.5">
                {contactRows.map((row) => (
                  <p key={row.label} className="text-[14px] text-[#6b6b6b]">
                    <span style={{ fontWeight: 700 }} className="text-[#161616]">
                      {row.label}:{" "}
                    </span>
                    {row.value}
                  </p>
                ))}
              </div>
            </Section>
          )}
        </div>

        <div className="flex flex-1 flex-col" style={{ gap: "var(--resume-section-gap, 2.5rem)" }}>
          {sections.experience?.length > 0 && (
            <Section title="Employment">
              <div className="space-y-8">
                {sections.experience.map((exp, i) => (
                  <div key={i}>
                    <p style={{ fontWeight: 700 }} className="text-[15px] text-[#161616]">
                      {exp.position}
                      {exp.company ? ` at ${exp.company}` : ""}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[13px] text-[#a0a0a0]">
                      <span>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                      {exp.location && <span>{exp.location}</span>}
                    </div>
                    {exp.description && <p className="mt-3 text-[14px] leading-[1.8] text-[#6b6b6b]">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {sections.education?.length > 0 && (
            <Section title="Education">
              <div className="space-y-5">
                {sections.education.map((ed, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between">
                      <p style={{ fontWeight: 700 }} className="text-[15px] text-[#161616]">
                        {ed.institution}
                      </p>
                      <span className="shrink-0 text-[13px] text-[#a0a0a0]">{dateRange(ed.startDate, ed.endDate)}</span>
                    </div>
                    <p className="mt-1 text-[14px] leading-[1.8] text-[#6b6b6b]">
                      {[ed.degree, ed.field].filter(Boolean).join(" in ")}
                      {ed.grade ? `, ${ed.grade}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {sections.certifications?.length > 0 && (
            <Section title="Certifications">
              <ul className="space-y-2 text-[14px] text-[#6b6b6b]">
                {sections.certifications.map((c, i) => (
                  <li key={i}>{[c.name, c.issuer, c.date].filter(Boolean).join(" — ")}</li>
                ))}
              </ul>
            </Section>
          )}

          {sections.languages?.length > 0 && (
            <Section title="Languages">
              <ul className="space-y-2 text-[14px] text-[#6b6b6b]">
                {sections.languages.map((l, i) => (
                  <li key={i}>{[l.name, l.level].filter(Boolean).join(" — ")}</li>
                ))}
              </ul>
            </Section>
          )}

          {sections.achievements?.length > 0 && (
            <Section title="Achievements">
              <ul className="space-y-2 text-[14px] leading-[1.8] text-[#6b6b6b]">
                {sections.achievements.map((a, i) => (
                  <li key={i}>
                    <span style={{ fontWeight: 700 }} className="text-[#161616]">
                      {a.title}
                    </span>
                    {a.description ? ` — ${a.description}` : ""}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 style={{ fontWeight: 800 }} className="mb-4 text-[22px] text-[#161616]">
        {title}
      </h2>
      {children}
    </div>
  );
}
