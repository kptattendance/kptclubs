import multer from "multer";

// Must match the limit shown to students on the website
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_PHOTO_BYTES,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return callback(null, true);
    }

    const error = new Error(
      "Only JPG, PNG or WEBP photos are allowed"
    );

    error.code = "INVALID_FILE_TYPE";

    callback(error);
  },
});

export default upload;
