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

// --------------------------------------------------
// Phone cameras produce photos of 3-10 MB. Instead of
// rejecting them, shrink the photo in the browser before
// it is uploaded. The result is a small JPEG.
// --------------------------------------------------

const PREPARED_MAX_SIDE = 1000;
const PREPARED_QUALITY = 0.85;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be read"));
    };

    image.src = url;
  });

const shrinkPhoto = async (file) => {
  const image = await loadImage(file);

  const width = image.naturalWidth;
  const height = image.naturalHeight;

  if (!width || !height) {
    throw new Error("Image has no size");
  }

  const scale = Math.min(
    1,
    PREPARED_MAX_SIDE / Math.max(width, height)
  );

  const canvas = document.createElement("canvas");

  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const context = canvas.getContext("2d");

  // White background for transparent PNG photos
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", PREPARED_QUALITY)
  );

  if (!blob) {
    throw new Error("Image could not be converted");
  }

  return new File([blob], "photo.jpg", {
    type: "image/jpeg",
  });
};

// Returns { file, error }. `file` is ready to upload.
export const preparePhotoFile = async (file) => {
  if (!file) {
    return { file: null, error: "Please choose a photo" };
  }

  // Some phones report no type at all, so only refuse
  // files that clearly are not images.
  if (file.type && !file.type.startsWith("image/")) {
    return {
      file: null,
      error: "Please choose a photo (image file)",
    };
  }

  try {
    return { file: await shrinkPhoto(file), error: "" };
  } catch {
    // The browser could not open it (for example an unusual
    // format). Upload the original if the server accepts it.
    const problem = validatePhotoFile(file);

    return problem
      ? {
          file: null,
          error:
            "This photo could not be read. Please choose a JPG or PNG photo",
        }
      : { file, error: "" };
  }
};
