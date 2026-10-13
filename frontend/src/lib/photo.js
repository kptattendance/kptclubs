// Photos are resized to a small JPEG when they are uploaded,
// so they can be used in lists exactly as stored.
export const photoThumb = (url) => url;

// Limits shown to the user. The server enforces the same ones.
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Returns an error message, or "" when the file is acceptable
export const validatePhotoFile = (file) => {
  if (!file) {
    return "Please choose a photo";
  }

  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return "Only JPG, PNG or WEBP photos are allowed";
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return "Photo size must be less than 2 MB";
  }

  return "";
};
