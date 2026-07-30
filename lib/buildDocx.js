import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { skillItems, dateRange } from "@/components/templates/helpers";

function heading(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 } });
}

function para(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 80 } });
}

export async function buildResumeDocx(resume) {
  const s = resume.sections || {};
  const pi = s.personalInfo || {};
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: pi.fullName || "Your Name", bold: true, size: 44 })],
      spacing: { after: 60 },
    })
  );
  if (pi.title) {
    children.push(para(pi.title, { size: 26, color: "666666" }));
  }
  const contactLine = [pi.email, pi.phone, pi.location, pi.linkedin, pi.github, pi.portfolio]
    .filter(Boolean)
    .join("  |  ");
  if (contactLine) children.push(para(contactLine, { size: 20, color: "666666" }));

  if (s.summary) {
    children.push(heading("Summary"));
    children.push(para(s.summary));
  }

  if (s.experience?.length) {
    children.push(heading("Experience"));
    s.experience.forEach((exp) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.position || ""}${exp.company ? `, ${exp.company}` : ""}`, bold: true }),
            new TextRun({ text: `  (${dateRange(exp.startDate, exp.endDate, exp.current)})`, italics: true, size: 20 }),
          ],
          spacing: { after: 40 },
        })
      );
      if (exp.description) children.push(para(exp.description));
    });
  }

  if (s.projects?.length) {
    children.push(heading("Projects"));
    s.projects.forEach((p) => {
      children.push(new Paragraph({ children: [new TextRun({ text: p.name || "", bold: true })], spacing: { after: 40 } }));
      if (p.description) children.push(para(p.description));
      if (p.tech) children.push(para(`Technologies: ${p.tech}`, { italics: true, size: 20 }));
    });
  }

  if (s.education?.length) {
    children.push(heading("Education"));
    s.education.forEach((ed) => {
      children.push(
        para(
          `${ed.degree || ""}${ed.field ? `, ${ed.field}` : ""} — ${ed.institution || ""} (${dateRange(
            ed.startDate,
            ed.endDate
          )})`
        )
      );
    });
  }

  if (s.skills?.length) {
    children.push(heading("Skills"));
    s.skills.forEach((g) => {
      const items = skillItems(g.items).join(", ");
      children.push(para(g.category ? `${g.category}: ${items}` : items));
    });
  }

  if (s.certifications?.length) {
    children.push(heading("Certifications"));
    s.certifications.forEach((c) => children.push(para([c.name, c.issuer, c.date].filter(Boolean).join(" — "))));
  }

  if (s.languages?.length) {
    children.push(heading("Languages"));
    children.push(para(s.languages.map((l) => [l.name, l.level].filter(Boolean).join(" (") + (l.level ? ")" : "")).join(", ")));
  }

  if (s.achievements?.length) {
    children.push(heading("Achievements"));
    s.achievements.forEach((a) => children.push(para(`${a.title}${a.description ? ` — ${a.description}` : ""}`)));
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
