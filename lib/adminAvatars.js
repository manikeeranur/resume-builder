import Profile from "@/lib/models/Profile";
import Resume from "@/lib/models/Resume";

// Resolves each user's best-available contact info for admin views. Most
// users only ever fill in their personal details while building a resume —
// Profile (the "master copy" used to prefill new resumes) only gets created
// once someone visits /profile itself and saves, which a lot of real users
// never do. Without this fallback, every admin table/detail view that only
// checked Profile showed a blank avatar and phone for those users even
// though the data clearly exists on their resume(s).
//
// Precedence: Profile > most recently edited Resume > (caller's own further
// fallback, e.g. User.image/User.phone).
export async function getAdminContactInfo(userIds) {
  const [profiles, resumes] = await Promise.all([
    Profile.find({ userId: { $in: userIds } }).select("userId sections.personalInfo.photo sections.personalInfo.phone"),
    Resume.find({ userId: { $in: userIds } })
      .select("userId sections.personalInfo.photo sections.personalInfo.phone updatedAt")
      .sort({ updatedAt: -1 }),
  ]);

  const byUser = new Map();
  // Sorted newest-first, so the first resume seen per user is their most
  // recently edited one.
  resumes.forEach((r) => {
    const key = r.userId.toString();
    if (byUser.has(key)) return;
    byUser.set(key, {
      photo: r.sections?.personalInfo?.photo || null,
      phone: r.sections?.personalInfo?.phone || null,
    });
  });

  profiles.forEach((p) => {
    const key = p.userId.toString();
    const fallback = byUser.get(key) || {};
    byUser.set(key, {
      photo: p.sections?.personalInfo?.photo || fallback.photo || null,
      phone: p.sections?.personalInfo?.phone || fallback.phone || null,
    });
  });

  return byUser;
}
