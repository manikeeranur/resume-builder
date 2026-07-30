import dbConnect from "@/lib/db";
import Resume from "@/lib/models/Resume";

// Loads a resume and returns it only if it belongs to the given user.
export async function getOwnedResume(id, userId) {
  await dbConnect();
  const resume = await Resume.findById(id);
  if (!resume || resume.userId.toString() !== userId) return null;
  return resume;
}
