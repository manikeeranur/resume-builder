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

  return (
    <div
      id="resume-content"
      // overflow-hidden doubles as a clearfix (establishes a block
      // formatting context) so the container still grows to the floated
      // aside's full height even though nothing "clears" it explicitly.
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
        fontFamily: "'Poppins', 'Avenir Next', 'Segoe UI', sans-serif",
        backgroundColor: "#f6f8fd",
        backgroundImage: "url(/templates/bg-template-5.png)",
        ...themeVars(themeConfig),
        "--resume-primary": themeConfig?.primaryColor || ACCENT,
      }}
    >
      <div
        // float (not flex) is what makes the reclaimed-width trick work:
        // main's text wraps around this box for exactly as long as it has
        // content, then automatically reclaims the full page width once it
        // ends — flexbox has no equivalent since a flex sibling always
        // reserves its column's width for the whole row's height. ml-10 is
        // the gap to main content: a float's MARGIN box (not just its
        // border box) is what main's text wraps around, so without this
        // the text butts right up against the aside's edge. pb (not the
        // plain py the top side uses) is much larger than a normal margin
        // because the decorative background's bottom artwork rises well
        // into the page — content needs real clearance from those peaks
        // on every page, not just a cosmetic gap.
        className="float-right ml-10 w-[230px] px-10 pt-11 pb-[190px]"
      >
        {/* Lines up "Details" with "Experience" on the left: that column
            starts with Name/Title/Summary before its first heading, so
            this reserves roughly the same height here. Approximate, not
            pixel-exact, since summary length varies resume to resume —
            true dynamic matching would need live height measurement,
            which the float-based reclaim-width layout can't do. */}
        <div className="h-[172px]" />

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
          <div className="pt-9 break-inside-avoid">
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
          <div className="pt-9 break-inside-avoid">
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
          <div className="pt-9 break-inside-avoid">
            <AsideHeading>Languages</AsideHeading>
            <div className="flex flex-wrap gap-1.5">
              {languages.map((l, i) => (
                <Pill key={i}>{l.name}</Pill>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Plain block, not a flex item — its text needs to actually flow
          around the floated aside (narrow while the float is active,
          full width once it ends), which a flex/grid sibling can't do. */}
      <div className="px-10 pt-11 pb-[190px]">
        <div className="text-[38px] font-bold leading-[1.05]" style={{ color: NAME_COLOR }}>
          {pi.fullName || "Your Name"}
        </div>
        <div className="mt-1 text-[16px] font-bold" style={{ color: "var(--resume-primary)" }}>
          {pi.title || "Your Title"}
        </div>

        {sections.summary && (
          <div className="mt-4 text-[13.5px] leading-[1.6] text-[#333333]">{sections.summary}</div>
        )}

        {experiences.length > 0 && (
          <div className="break-inside-avoid pt-7">
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
          <div className="break-inside-avoid pt-7">
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
