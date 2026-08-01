"use client";

import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Camera, Pencil, X } from "lucide-react";
import { getCroppedImageBlob } from "@/lib/cropImage";
import RippleButton from "@/components/ui/RippleButton";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Every user's photos live in their own Cloudinary folder (userId-name), so
// uploads from different accounts never collide or overwrite each other.
function folderFor(userId, name) {
  const slug = (name || "user")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `resume-builder/${userId}-${slug || "user"}`;
}

export default function PhotoUploader({ value, name, userId, onChange }) {
  const fileInputRef = useRef(null);
  const [rawImage, setRawImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = () => setRawImage(reader.result);
    reader.readAsDataURL(file);
  };

  const closeModal = () => {
    setRawImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError("");
  };

  const handleSave = async () => {
    if (!croppedAreaPixels || !userId) return;
    setUploading(true);
    setError("");
    try {
      const blob = await getCroppedImageBlob(rawImage, croppedAreaPixels);
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", folderFor(userId, name));

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.secure_url) throw new Error("Upload failed");

      onChange(data.secure_url);
      closeModal();
    } catch (err) {
      setError("Couldn't upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-text-secondary">Photo</label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={value ? "Change photo" : "Upload photo"}
          className="group relative h-[120px] w-[120px] shrink-0 rounded-full"
        >
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-border bg-bg">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <Camera size={32} className="text-text-secondary" />
            )}
          </div>
          {value && (
            <span className="absolute bottom-0.5 right-0.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-card-lg transition-transform group-hover:scale-110">
              <Pencil size={16} />
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        {!value && (
          <RippleButton
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary px-3.5 py-2 text-xs"
          >
            Upload photo
          </RippleButton>
        )}
      </div>

      {rawImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-card-lg">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-bold text-text">Crop photo</h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative h-80 w-full bg-bg">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="px-5 py-4">
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-3.5">
              <button type="button" onClick={closeModal} className="btn-secondary px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={uploading}
                className="btn-primary px-5 py-2 text-sm"
              >
                {uploading ? "Uploading…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
