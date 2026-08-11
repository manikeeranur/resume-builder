"use client";

import { useRef, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

function slugify(s) {
  return (
    (s || "template")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "template"
  );
}

// Uploads straight to Cloudinary from the browser — same unsigned-preset
// mechanism as components/editor/PhotoUploader.jsx, just without the
// cropping step (a resume-page thumbnail keeps its own aspect ratio). Lands
// in resume-builder/templates/<template-id-or-name> so each template's
// thumbnail sits in its own predictable folder instead of one flat bucket.
// The URL field itself stays a plain, editable input underneath — an admin
// can still paste a path to a static /public asset (like the built-ins'
// own /templates/template-N.png) instead of uploading.
export default function ThumbnailUploader({ value, templateKey, onChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", `resume-builder/templates/${slugify(templateKey)}`);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.secure_url) throw new Error("Upload failed");
      onChange(data.secure_url);
    } catch {
      setError("Couldn't upload thumbnail. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Thumbnail" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon size={18} className="text-text-secondary" />
          )}
        </div>
        <div className="flex-1">
          <input
            className="input-field font-mono text-xs"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/templates/my-template.png"
          />
          <div className="mt-1.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-60"
            >
              <Upload size={12} />
              {uploading ? "Uploading…" : "Upload image"}
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
}
