import { dateRange, skillItems, themeVars } from "./helpers";

const ACCENT = "#1a5f4f";

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

function SidebarHeading({ children }) {
  return <div className="mb-3 text-[18px] font-bold text-white">{children}</div>;
}

function MainHeading({ children }) {
  return <div className="mb-3 text-[21px] font-bold text-[#111111]">{children}</div>;
}

export default function Template4({ resume }) {
  const { sections, themeConfig } = resume;
  const pi = sections.personalInfo || {};

  const experiences = sections.experience || [];
  const education = sections.education || [];
  const languages = sections.languages || [];
  const skills = (sections.skills || []).flatMap((g) => skillItems(g.items)).filter(Boolean);

  const links = [
    pi.linkedin && { label: "LinkedIn", href: pi.linkedin },
    pi.github && { label: "GitHub", href: pi.github },
    pi.portfolio && { label: "Portfolio", href: pi.portfolio },
  ].filter(Boolean);

  // Tracks which main-column section renders first so it can skip its
  // top padding (the column's own py-11 already clears the page top for
  // it) while every later section still gets one, including when
  // break-inside-avoid relocates it to the top of a fresh printed page.
  const firstMainSection = [
    sections.summary && "profile",
    experiences.length > 0 && "experience",
    education.length > 0 && "education",
  ].filter(Boolean)[0];
  const sectionTop = (key) => (key === firstMainSection ? "" : "pt-7");

  return (
    <div
      id="resume-content"
      // overflow-hidden doubles as a clearfix here (it establishes a block
      // formatting context), so the container still grows to the floated
      // sidebar's full height even though nothing "clears" it explicitly.
      className="mx-auto w-[850px] overflow-hidden bg-white text-[#171717]"
      style={{
        fontFamily: "'Poppins', 'Avenir Next', 'Segoe UI', sans-serif",
        ...themeVars(themeConfig),
        "--resume-primary": themeConfig?.primaryColor || ACCENT,
      }}
    >
      <div
        // float (not flex) is what makes the reclaimed-width trick work:
        // main's text wraps around this box for exactly as long as it has
        // content, then automatically reclaims the full page width once it
        // ends — flexbox has no equivalent since a flex sibling always
        // reserves its column's width for the whole row's height.
        // print:min-h-screen guarantees it still fully colors the first
        // printed page (screen == the page box in print media) even when
        // its own content is short. mr-10 is the gap to main content: a
        // float's MARGIN box (not just its border box) is what main's text
        // wraps around, so without this the text butts right up against
        // the sidebar's edge, overriding main's own left padding.
        className="float-left mr-10 w-[264px] px-8 py-11 text-center print:min-h-screen"
        style={{ background: "var(--resume-primary)" }}
      >
        {pi.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pi.photo}
            alt={pi.fullName || "Profile"}
            className="mx-auto h-[100px] w-[100px] rounded-full border-[3px] border-white/40 object-cover"
          />
        )}
        <div className="mt-4 text-[19px] font-bold text-white">{pi.fullName || "Your Name"}</div>
        <div className="mt-1 text-[14px] text-white/70">{pi.title || "Your Title"}</div>

        {(pi.location || pi.phone || pi.email) && (
          // pt- (not mt-) so this block keeps its top breathing room even
          // when break-inside-avoid pushes it to start a fresh printed page
          // — margins collapse to 0 at a page-fragmentation boundary, but
          // padding on the box itself survives.
          <div className="pt-10 text-left break-inside-avoid">
            <SidebarHeading>Details</SidebarHeading>
            <div>
              {pi.location && (
                <div className="break-inside-avoid">
                  <div className="text-[13px] font-bold text-white">Address</div>
                  <div className="mt-0.5 text-[13px] text-white/70">{pi.location}</div>
                </div>
              )}
              {pi.phone && (
                <div className="break-inside-avoid pt-3.5">
                  <div className="text-[13px] font-bold text-white">Phone</div>
                  <div className="mt-0.5 text-[13px] text-white/70">{pi.phone}</div>
                </div>
              )}
              {pi.email && (
                <div className="break-inside-avoid pt-3.5">
                  <div className="text-[13px] font-bold text-white">Email</div>
                  <div className="mt-0.5 break-all text-[13px] text-white/70">{pi.email}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {links.length > 0 && (
          <div className="pt-9 text-left break-inside-avoid">
            <SidebarHeading>Links</SidebarHeading>
            <div>
              {links.map((l, i) => (
                <div key={l.label} className={`break-inside-avoid ${i === 0 ? "" : "pt-3.5"}`}>
                  <div className="text-[13px] font-bold text-white">{l.label}</div>
                  <a
                    href={l.href}
                    className="mt-0.5 block break-all text-[13px] text-white/70 no-underline"
                  >
                    {l.href.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {skills.length > 0 && (
          <div className="pt-9 text-left break-inside-avoid">
            <SidebarHeading>Skills</SidebarHeading>
            {/* Wrapped pill tags rather than one bar per skill: a real
                resume can list dozens of skills, and a bar-per-line layout
                grows too tall to fit a page, leaving the sidebar's color
                block to end mid-list wherever the page happens to break. */}
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className="break-inside-avoid rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] leading-none text-white/90"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {languages.length > 0 && (
          <div className="pt-9 text-left break-inside-avoid">
            <SidebarHeading>Languages</SidebarHeading>
            <div className="flex flex-wrap gap-1.5">
              {languages.map((l, i) => (
                <span
                  key={i}
                  className="break-inside-avoid rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] leading-none text-white/90"
                >
                  {l.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Plain block, not a flex item — its text needs to actually flow
          around the floated sidebar (narrow while the float is active,
          full width once it ends), which a flex/grid sibling can't do. */}
      <div className="px-10 py-11">
        {sections.summary && (
          <div className={`break-inside-avoid ${sectionTop("profile")}`}>
            <MainHeading>Profile</MainHeading>
            <div className="text-[13.5px] leading-[1.6] text-[#333333]">{sections.summary}</div>
          </div>
        )}

        {experiences.length > 0 && (
          <div className={`break-inside-avoid ${sectionTop("experience")}`}>
            <MainHeading>Experience</MainHeading>
            <div>
              {experiences.map((exp, i) => (
                <div key={i} className={`break-inside-avoid ${i === 0 ? "" : "pt-4"}`}>
                  <div className="text-[15px] font-bold text-[#111111]">{exp.company}</div>
                  <div className="text-[13.5px] text-[#333333]">{exp.position}</div>
                  <div className="text-[12.5px] text-[#8a8a8a]">
                    {dateRange(exp.startDate, exp.endDate, exp.current)}
                  </div>
                  {exp.description && (
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-5 marker:text-gray-400">
                      {splitBullets(exp.description).map((line, j) => (
                        <li key={j} className="text-[13px] leading-[1.45] text-[#333333]">
                          {line}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div className={`break-inside-avoid ${sectionTop("education")}`}>
            <MainHeading>Education</MainHeading>
            <div>
              {education.map((ed, i) => (
                <div key={i} className={`break-inside-avoid ${i === 0 ? "" : "pt-2.5"}`}>
                  <div className="text-[15px] font-bold text-[#111111]">{ed.institution}</div>
                  <div className="text-[13px] text-[#333333]">
                    {[ed.field || ed.degree, dateRange(ed.startDate, ed.endDate)].filter(Boolean).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
