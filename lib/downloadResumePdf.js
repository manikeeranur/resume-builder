// Shared by every "Download" action (resume cards, preview page) so the
// blob-download dance and the download-count tracking ping stay in one place.
export async function downloadResumePdf(resume) {
  const filename = `${(resume.title || "Resume").replace(/[^a-z0-9]+/gi, "_")}.pdf`;
  const res = await fetch(`/api/resumes/${resume._id}/pdf`);
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

  // POST is the plan's download-limit gate and the only place a download is
  // actually recorded — generation above already succeeded, so a rejection
  // here (limit reached) surfaces to the caller even though the file was
  // already handed to the browser once. See the route for why the limit
  // can't be checked before generating (GET is shared with the preview
  // viewer, which must keep working past the limit).
  const countRes = await fetch(`/api/resumes/${resume._id}/pdf`, { method: "POST" });
  if (!countRes.ok) {
    const data = await countRes.json().catch(() => ({}));
    throw new Error(data.error || "Download failed");
  }
}
