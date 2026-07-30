// Best-effort total professional experience duration from an experience[]
// array's date ranges. Returns null when dates can't be parsed, so callers
// can simply skip rendering the line rather than showing something wrong.
export function totalExperienceDuration(experience) {
  if (!Array.isArray(experience) || experience.length === 0) return null;

  let earliestStart = null;
  let latestEnd = null;

  for (const exp of experience) {
    const start = exp.startDate ? new Date(exp.startDate) : null;
    if (start && !Number.isNaN(start.getTime())) {
      if (!earliestStart || start < earliestStart) earliestStart = start;
    }

    const end = exp.current ? new Date() : exp.endDate ? new Date(exp.endDate) : null;
    if (end && !Number.isNaN(end.getTime())) {
      if (!latestEnd || end > latestEnd) latestEnd = end;
    }
  }

  if (!earliestStart || !latestEnd || latestEnd <= earliestStart) return null;

  let months =
    (latestEnd.getFullYear() - earliestStart.getFullYear()) * 12 + (latestEnd.getMonth() - earliestStart.getMonth());
  if (months < 0) return null;

  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  const parts = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (remMonths > 0) parts.push(`${remMonths} month${remMonths === 1 ? "" : "s"}`);
  if (parts.length === 0) return null;

  return parts.join(" ");
}
