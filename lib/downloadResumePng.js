// Mirrors downloadResumePdf.js — fetches the server-rendered HD PNG of the
// resume's first page and hands it to the browser as a download. Unlike the
// PDF path there's no follow-up count/limit ping: the PDF stays the tracked,
// plan-gated deliverable; the PNG is a convenience export.
export async function downloadResumePng(resume) {
  const filename = `${(resume.title || "Resume").replace(/[^a-z0-9]+/gi, "_")}.png`;
  const res = await fetch(`/api/resumes/${resume._id}/png`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Download failed");
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
