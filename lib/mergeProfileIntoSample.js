function hasContent(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return Boolean(value);
}

// Blends an admin's own Profile (same shape as a resume — see
// lib/models/Profile.js) into the sample resume used for template previews:
// their real name/email/photo/etc., but falling back to the sample's rich
// fictional content for any section they haven't filled in themselves, so
// an admin's own template preview still looks like a complete resume even
// if they've never built one for their own account.
export function mergeProfileIntoSample(sampleResume, profile) {
  if (!profile) return sampleResume;

  const profileSections = profile.sections || {};
  const sampleSections = sampleResume.sections;

  const personalInfo = { ...sampleSections.personalInfo };
  for (const [key, value] of Object.entries(profileSections.personalInfo || {})) {
    if (hasContent(value)) personalInfo[key] = value;
  }

  const sections = { ...sampleSections, personalInfo };
  for (const key of ["summary", "experience", "projects", "skills", "education", "certifications", "languages", "achievements"]) {
    if (hasContent(profileSections[key])) sections[key] = profileSections[key];
  }

  return { ...sampleResume, sections };
}
