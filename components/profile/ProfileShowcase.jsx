import {
  Award,
  Briefcase,
  Building2,
  Code2,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  Globe,
  Languages as LanguagesIcon,
  Link2,
  Mail,
  MapPin,
  Medal,
  Phone,
  Target,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { IconBrandGithub } from "@tabler/icons-react";
import { dateRange, formatMonthYear, skillItems } from "@/components/templates/helpers";
import GradientAvatar from "./GradientAvatar";

const ACHIEVEMENT_ICONS = [Trophy, Target, Zap, Award];

function splitBullets(text) {
  return (text || "")
    .replace(/\n/g, " ")
    .split(/\.\s+/)
    .map((l) => l.trim().replace(/\.$/, ""))
    .filter(Boolean)
    .map((l) => `${l}.`);
}

function Bullets({ text, className = "text-xs" }) {
  const lines = splitBullets(text);
  if (!lines.length) return null;
  return (
    <ul className="mt-2 space-y-1">
      {lines.map((line, j) => (
        <li key={j} className={`flex gap-2 text-text-secondary ${className}`}>
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-text-secondary" />
          {line}
        </li>
      ))}
    </ul>
  );
}

const LEVEL_PERCENT = {
  native: 100,
  fluent: 90,
  advanced: 80,
  proficient: 80,
  conversational: 65,
  intermediate: 55,
  basic: 35,
  beginner: 25,
};

function levelPercent(level) {
  return LEVEL_PERCENT[(level || "").trim().toLowerCase()] ?? 70;
}

function withProtocol(url) {
  return url && !/^https?:\/\//i.test(url) ? `https://${url}` : url;
}

function displayUrl(url) {
  return (url || "").replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function parseMonthYear(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value || "");
  return match ? Number(match[1]) * 12 + Number(match[2]) : null;
}

// Derived, not stored — computed from real experience date ranges so this
// never claims a number the user didn't actually enter.
function computeYearsExperience(experience) {
  if (!experience?.length) return 0;
  const now = new Date();
  const nowYm = now.getFullYear() * 12 + (now.getMonth() + 1);
  let earliest = null;
  let latest = null;
  experience.forEach((exp) => {
    const start = parseMonthYear(exp.startDate);
    if (start == null) return;
    const end = exp.current ? nowYm : parseMonthYear(exp.endDate) ?? start;
    if (earliest == null || start < earliest) earliest = start;
    if (latest == null || end > latest) latest = end;
  });
  if (earliest == null || latest == null) return 0;
  return Math.max(1, Math.round((latest - earliest) / 12));
}

// The read-mode view of a user's own profile — a portfolio-style summary
// of everything they've filled in, shown by default on /profile. Editing
// happens in a separate mode (see ProfileEditor); this component only
// ever displays.
//
// `embedded` drops the full-viewport min-h-screen/page-background wrapper
// for callers (e.g. the admin user detail page) that place this inside
// their own page — which already supplies that same #f8f9fc background —
// instead of as a standalone route.
export default function ProfileShowcase({ sections, isPremium, embedded = false }) {
  const pi = sections.personalInfo || {};
  const experience = sections.experience || [];
  const projects = sections.projects || [];
  const skills = sections.skills || [];
  const education = sections.education || [];
  const certifications = sections.certifications || [];
  const languages = sections.languages || [];
  const achievements = sections.achievements || [];
  const summary = sections.summary || "";

  const initials = (pi.fullName || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const yearsExperience = computeYearsExperience(experience);

  const stats = [
    yearsExperience > 0 && { icon: Medal, value: `${yearsExperience}+`, label: "Experience" },
    projects.length > 0 && { icon: FolderKanban, value: `${projects.length}+`, label: "Projects" },
    certifications.length > 0 && { icon: Award, value: certifications.length, label: "Certs" },
    skills.length > 0 && { icon: Code2, value: skills.length, label: "Skills" },
  ].filter(Boolean);

  const contactItems = [
    { icon: Phone, value: pi.phone, href: pi.phone ? `tel:${pi.phone}` : null },
    { icon: Mail, value: pi.email, href: pi.email ? `mailto:${pi.email}` : null },
    { icon: MapPin, value: pi.location, href: null },
    { icon: Link2, value: displayUrl(pi.linkedin), href: withProtocol(pi.linkedin) },
    { icon: IconBrandGithub, value: displayUrl(pi.github), href: withProtocol(pi.github) },
    { icon: Globe, value: displayUrl(pi.portfolio), href: withProtocol(pi.portfolio) },
  ].filter((c) => c.value);

  const isEmpty =
    !pi.fullName && !summary && !experience.length && !projects.length && !skills.length && !education.length;

  return (
    <div className={embedded ? "" : "min-h-screen bg-[#f8f9fc]"}>
      <div className={embedded ? "" : "mx-auto max-w-[1100px] px-4 py-6 sm:px-6"}>
        {/* Profile header */}
        <div className="rounded-2xl bg-white p-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
            <GradientAvatar photo={pi.photo} alt={pi.fullName} initials={initials} size="lg" isPremium={isPremium} />

            <div className="min-w-0">
              <h1 className="text-base font-bold text-text">{pi.fullName || "Add your name"}</h1>
              {pi.title && <p className="mt-1 text-sm font-semibold text-primary">{pi.title}</p>}

              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-text-secondary sm:justify-start">
                {pi.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-primary/70" />
                    {pi.location}
                  </span>
                )}
                {yearsExperience > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase size={14} className="text-primary/70" />
                    {yearsExperience}+ years experience
                  </span>
                )}
              </div>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-6 border-t border-border pt-6 sm:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <s.icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-bold leading-tight text-text">{s.value}</p>
                    <p className="truncate text-xs text-text-secondary">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isEmpty ? (
          <div className="py-16 text-center">
            <p className="text-sm text-text-secondary">
              Your profile is empty so far — click Edit above to fill it in. It&apos;ll show up here, and every new
              resume will be pre-filled from it.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
            {/* Main column */}
            <div className="min-w-0 space-y-6">
              {summary && (
                <div className="rounded-2xl bg-white p-6">
                  <SectionHeading icon={User} label="About Me" />
                  <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">{summary}</p>
                </div>
              )}

              {experience.length > 0 && (
                <div className="rounded-2xl bg-white p-6">
                  <SectionHeading icon={Briefcase} label="Work Experience" />
                  <div className="space-y-6">
                    {experience.map((exp, i) => (
                      <div key={i} className="relative border-l-2 border-primary-light pl-4">
                        <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-primary" />
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <h3 className="text-sm font-bold text-text">{exp.position || "Role"}</h3>
                          <span className="text-xs font-medium text-text-secondary">
                            {dateRange(exp.startDate, exp.endDate, exp.current)}
                          </span>
                        </div>
                        {exp.company && (
                          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                            <Building2 size={13} />
                            {exp.company}
                          </p>
                        )}
                        <Bullets text={exp.description} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {projects.length > 0 && (
                <div className="rounded-2xl bg-white p-6">
                  <SectionHeading icon={FolderKanban} label="Projects" />
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {projects.map((p, i) => (
                      <div key={i} className="rounded-xl bg-[#f8f9fc] p-6">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-text">{p.name || `Project ${i + 1}`}</h3>
                          {p.link && (
                            <a
                              href={withProtocol(p.link)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open ${p.name || "project"}`}
                              className="shrink-0 text-text-secondary hover:text-primary"
                            >
                              <ExternalLink size={15} />
                            </a>
                          )}
                        </div>
                        <Bullets text={p.description} />
                        {p.tech && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {skillItems(p.tech).map((t, j) => (
                              <span key={j} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-primary">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {education.length > 0 && (
                <div className="rounded-2xl bg-white p-6">
                  <SectionHeading icon={GraduationCap} label="Education" />
                  <div className="space-y-6">
                    {education.map((ed, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-4 last:border-0 last:pb-0"
                      >
                        <div>
                          <h3 className="text-sm font-bold text-text">{ed.degree || "Degree"}</h3>
                          {ed.institution && <p className="text-xs text-text-secondary">{ed.institution}</p>}
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-medium text-text-secondary">
                            {dateRange(ed.startDate, ed.endDate)}
                          </span>
                          {ed.grade && <span className="text-xs font-semibold text-primary">{ed.grade}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {certifications.length > 0 && (
                <div className="rounded-2xl bg-white p-6">
                  <SectionHeading icon={Award} label="Certifications" />
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {certifications.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-[#f8f9fc] p-6">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                          <Award size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-text">{c.name}</p>
                          <p className="truncate text-xs text-text-secondary">
                            {[c.issuer, formatMonthYear(c.date)].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {contactItems.length > 0 && (
                <div className="rounded-2xl bg-white p-6">
                  <SectionHeading icon={Phone} label="Contact Information" />
                  <div className="space-y-6">
                    {contactItems.map(({ icon: Icon, value, href }, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <Icon size={15} className="shrink-0 text-primary" />
                        {href ? (
                          <a
                            href={href}
                            target={href.startsWith("http") ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className="truncate hover:text-primary"
                          >
                            {value}
                          </a>
                        ) : (
                          <span className="truncate">{value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {skills.length > 0 && (
                <div className="rounded-2xl bg-white p-6">
                  <SectionHeading icon={Code2} label="Skills" />
                  <div className="space-y-6">
                    {skills.map((group, i) => (
                      <div key={i}>
                        {group.category && <p className="mb-1.5 text-xs font-semibold text-text-secondary">{group.category}</p>}
                        <div className="flex flex-wrap gap-1.5">
                          {skillItems(group.items).map((s, j) => (
                            <span key={j} className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {languages.length > 0 && (
                <div className="rounded-2xl bg-white p-6">
                  <SectionHeading icon={LanguagesIcon} label="Languages" />
                  <div className="space-y-6">
                    {languages.map((l, i) => (
                      <div key={i}>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-text">{l.name}</span>
                          {l.level && <span className="text-xs text-text-secondary">{l.level}</span>}
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-light">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${levelPercent(l.level)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {achievements.length > 0 && (
                <div className="rounded-2xl bg-white p-6">
                  <SectionHeading icon={Trophy} label="Achievements" />
                  <div className="space-y-6">
                    {achievements.map((a, i) => {
                      const Icon = ACHIEVEMENT_ICONS[i % ACHIEVEMENT_ICONS.length];
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                            <Icon size={15} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text">{a.title}</p>
                            {a.description && <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{a.description}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, label }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
        <Icon size={16} />
      </span>
      <h2 className="text-base font-bold text-text">{label}</h2>
    </div>
  );
}
