"use client";

import { useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";

import api from "@/lib/api";
import { preparePhotoFile } from "@/lib/photo";

// Photos saved before the storage change can no longer be shown
const isOldPhoto = (url) =>
  typeof url === "string" &&
  url.includes("res.cloudinary.com");

export default function StudentPhotoUpdater({
  photoUrl,
  onUpdated,
}) {
  const { getToken } = useAuth();

  const fileInput = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const needsPhoto = !photoUrl || isOldPhoto(photoUrl);

  const handleFile = async (event) => {
    const selectedFile = event.target.files?.[0];

    // Allow choosing the same file again later
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    setSuccess("");

    // Large phone photos are reduced automatically
    const prepared = await preparePhotoFile(selectedFile);

    if (prepared.error) {
      setError(prepared.error);
      return;
    }

    const file = prepared.file;

    try {
      setUploading(true);
      setError("");

      const token = await getToken();

      const formData = new FormData();

      formData.append("image", file);

      const response = await api.put(
        "/api/student/photo",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // The browser adds the multipart boundary itself
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(
        response.data?.message ||
          "Photo updated successfully"
      );

      onUpdated?.(response.data?.photoUrl);
    } catch (uploadError) {
      setError(
        uploadError.response?.data?.message ||
          "Failed to update photo. Please try again"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`mb-6 rounded-2xl border p-4 sm:p-5 ${
        needsPhoto
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {needsPhoto
              ? "Please upload your profile photo"
              : "Profile photo"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {needsPhoto
              ? "Your photo is missing. Upload a clear passport-size photo. It is printed on your certificate."
              : "You can replace your photo at any time."}{" "}
            Any clear photo from your phone or computer.
          </p>
        </div>

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
          className="w-full shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {uploading
            ? "Uploading..."
            : needsPhoto
              ? "Upload Photo"
              : "Change Photo"}
        </button>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      {success && !error && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          {success}
        </p>
      )}
    </div>
  );
}
