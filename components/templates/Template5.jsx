import { dateRange, skillItems, themeVars } from "./helpers";

const ACCENT = "#4a7097";
const NAME_COLOR = "#00356b";

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

function AsideHeading({ children }) {
  return (
    <div className="mb-3 text-[18px] font-bold" style={{ color: "var(--resume-primary)" }}>
      {children}
    </div>
  );
}

function MainHeading({ children }) {
  return (
    <div className="mb-3 text-[21px] font-bold" style={{ color: "var(--resume-primary)" }}>
      {children}
    </div>
  );
}

function Pill({ children }) {
  return (
    <span className="break-inside-avoid rounded-full border border-[#dde3f0] bg-[#eef1f8] px-2.5 py-1 text-[11.5px] leading-none text-[#33415c]">
      {children}
    </span>
  );
}

export default function Template5({ resume }) {
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
  const hasMainContent = experiences.length > 0 || education.length > 0;
  const hasAsideContent = Boolean(
    pi.location || pi.phone || pi.email || skills.length || links.length || languages.length
  );

  return (
    <div
      id="resume-content"
      // overflow-hidden keeps the decorative artwork clipped to the
      // resume canvas in screen previews.
      // bg-cover/no-repeat is the sane single-page fallback (thumbnails,
      // scaled previews); print: overrides it to tile the same artwork
      // once per physical page. The 1201px isn't arbitrary: at this
      // content width (850px), Puppeteer's print pipeline scales content
      // to fit A4's width, and one physical A4 page works out to exactly
      // that much CSS height at that scale — measured directly against a
      // real generated PDF's page dimensions, not assumed from 100vh
      // (which resolves to the live browser viewport, not the print page).
      // print:min-h forces the box itself to be at least one page tall —
      // a background only paints within its own element's box, so short
      // content would otherwise leave the rest of page 1 with no artwork
      // at all (that leftover area belongs to the page, not this div).
      className="relative mx-auto w-[850px] overflow-hidden bg-cover bg-top bg-no-repeat text-[#171717] print:min-h-[1201px] print:bg-repeat-y print:[background-size:100%_1201px]"
      style={{
        fontFamily: "var(--resume-font), 'Poppins', 'Avenir Next', 'Segoe UI', sans-serif",
        backgroundColor: "#f6f8fd",
        backgroundImage: "url(/templates/bg-template-5.png)",
        ...themeVars(themeConfig),
        "--resume-primary": themeConfig?.primaryColor || ACCENT,
      }}
    >
      {/* Full-width header sits above both content columns. */}
      <header className="relative z-10 break-inside-avoid px-10 pt-11">
        <div className="text-[38px] font-bold leading-[1.05]" style={{ color: NAME_COLOR }}>
          {pi.fullName || "Your Name"}
        </div>
        <div className="mt-1 text-[16px] font-bold" style={{ color: "var(--resume-primary)" }}>
          {pi.title || "Your Title"}
        </div>

        {sections.summary && (
          <div className="mt-4 max-w-[690px] text-[13.5px] leading-[1.6] text-[#333333]">
            {sections.summary}
          </div>
        )}
      </header>

      {/* A fixed print layer is repeated by Chromium on every physical
          page. The resume container's own background still handles the
          screen preview, while this layer paints the unused remainder of
          the final PDF page after the content box has ended. */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden print:fixed print:inset-0 print:z-0 print:block print:h-[1201px] print:w-[850px] print:bg-cover print:bg-top print:bg-no-repeat"
        style={{
          backgroundColor: "#f6f8fd",
          backgroundImage: "url(/templates/bg-template-5.png)",
        }}
      />

      <div
        className={`relative z-10 grid items-start pt-7 ${
          hasMainContent && hasAsideContent ? "grid-cols-[minmax(0,1fr)_40%] gap-x-10" : "grid-cols-1"
        }`}
      >
        <div
          // The negative top margin offsets the sidebar's own top padding
          // so Details aligns with Experience. (No bottom counterpart: a
          // matching bottom bleed used to push content that already fit
          // on one page into a near-empty trailing page.)
          className={`${hasAsideContent ? "" : "hidden"} ${
            hasMainContent ? "col-start-2" : "col-start-1"
          } row-start-1 -mt-[200px] pt-[200px] pr-12`}
        >
        {(pi.location || pi.phone || pi.email) && (
          // pt- (not mt-) so this block keeps its top breathing room even
          // when break-inside-avoid pushes it to start a fresh printed
          // page — margins collapse to 0 at a page-fragmentation
          // boundary, but padding on the box itself survives.
          <div className="break-inside-avoid">
            <AsideHeading>Details</AsideHeading>
            <div>
              {pi.location && (
                <div className="break-inside-avoid">
                  <div className="text-[13px] font-bold text-[#171717]">Address</div>
                  <div className="mt-0.5 text-[13px] text-[#666666]">{pi.location}</div>
                </div>
              )}
              {pi.phone && (
                <div className="break-inside-avoid pt-3.5">
                  <div className="text-[13px] font-bold text-[#171717]">Phone</div>
                  <div className="mt-0.5 text-[13px] text-[#666666]">{pi.phone}</div>
                </div>
              )}
              {pi.email && (
                <div className="break-inside-avoid pt-3.5">
                  <div className="text-[13px] font-bold text-[#171717]">Email</div>
                  <div className="mt-0.5 break-all text-[13px] text-[#666666]">{pi.email}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {skills.length > 0 && (
          <div className="pt-5 break-inside-avoid">
            <AsideHeading>Skills</AsideHeading>
            {/* Wrapped pill tags rather than one bar per skill: a real
                resume can list dozens of skills, and a bar-per-line
                layout grows too tall to fit a page. */}
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <Pill key={i}>{s}</Pill>
              ))}
            </div>
          </div>
        )}

        {links.length > 0 && (
          <div className="pt-5 break-inside-avoid">
            <AsideHeading>Links</AsideHeading>
            <div>
              {links.map((l, i) => (
                <div key={l.label} className={`break-inside-avoid ${i === 0 ? "" : "pt-3.5"}`}>
                  <div className="text-[13px] font-bold text-[#171717]">{l.label}</div>
                  <a href={l.href} className="mt-0.5 block break-all text-[13px] text-[#666666] no-underline">
                    {l.href.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {languages.length > 0 && (
          <div className="pt-5 break-inside-avoid">
            <AsideHeading>Languages</AsideHeading>
            <div className="flex flex-wrap gap-1.5">
              {languages.map((l, i) => (
                <Pill key={i}>{l.name}</Pill>
              ))}
            </div>
          </div>
        )}
        </div>

        <div
          className={`${hasMainContent ? "" : "hidden"} col-start-1 row-start-1 min-w-0 px-10`}
        >
        {experiences.length > 0 && (
          <div className="break-inside-avoid">
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
          <div className="break-inside-avoid pt-5">
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
    </div>
  );
}
