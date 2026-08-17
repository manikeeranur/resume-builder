// Shared by ChatWidget.jsx (user) and ChatThreadPanel.jsx (admin) — same
// unsigned Cloudinary upload pattern already used for profile photos (see
// components/editor/PhotoUploader.jsx), just without the crop step.
// Images only — no PDFs/docs/video — enforced both via the file picker's
// `accept` and again here, since `accept` is only a picker hint and doesn't
// block drag-and-drop.
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const CHAT_ATTACHMENT_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export async function uploadChatAttachment(file, userId) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only images can be attached.");
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("File is too large (max 10MB).");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", `resume-builder/chat/${userId}`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error("Upload failed");

  return {
    attachmentUrl: data.secure_url,
    attachmentType: "image",
    attachmentName: file.name,
  };
}
