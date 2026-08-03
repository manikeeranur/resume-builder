// Shared by every "Download" action (resume cards, preview page) so the
// blob-download dance and the download-count tracking ping stay in one place.
export async function downloadResumePdf(resume) {
  const filename = `${(resume.title || "Resume").replace(/[^a-z0-9]+/gi, "_")}.pdf`;
  const res = await fetch(`/api/resumes/${resume._id}/pdf`);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);

  // Best-effort — a failed count bump shouldn't surface as a failed download.
  await fetch(`/api/resumes/${resume._id}/pdf`, { method: "POST" }).catch(() => {});
}
