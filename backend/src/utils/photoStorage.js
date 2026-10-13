import crypto from "crypto";
import sharp from "sharp";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// --------------------------------------------------
// Student photos are stored in a Cloudflare R2 bucket.
//
// Required environment variables:
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
//   R2_BUCKET, R2_PUBLIC_URL
// --------------------------------------------------

const PHOTO_FOLDER = "students";

// Every photo is stored as a small square-ish JPEG
const PHOTO_MAX_SIZE = 500;
const PHOTO_QUALITY = 80;

const getPublicBaseUrl = () =>
  (process.env.R2_PUBLIC_URL || "")
    .trim()
    .replace(/\/+$/, "");

export const isPhotoStorageConfigured = () =>
  Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      getPublicBaseUrl()
  );

let client = null;

const getClient = () => {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return client;
};

// Only photos stored in this project's bucket are trusted
export const isOwnPhotoUrl = (fileUrl) => {
  const baseUrl = getPublicBaseUrl();

  return (
    Boolean(baseUrl) &&
    typeof fileUrl === "string" &&
    fileUrl.startsWith(`${baseUrl}/${PHOTO_FOLDER}/`)
  );
};

const getPhotoKey = (fileUrl) =>
  fileUrl.slice(getPublicBaseUrl().length + 1);

// Resize + store. Returns the public URL of the stored photo.
// Throws an error with code "INVALID_IMAGE" for unreadable files.
export const uploadPhoto = async (buffer) => {
  let resized;

  try {
    resized = await sharp(buffer)
      // Respect the phone's orientation flag
      .rotate()
      .resize(PHOTO_MAX_SIZE, PHOTO_MAX_SIZE, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: PHOTO_QUALITY,
        mozjpeg: true,
      })
      .toBuffer();
  } catch {
    const error = new Error(
      "This photo could not be read. Please upload a JPG or PNG photo"
    );

    error.code = "INVALID_IMAGE";

    throw error;
  }

  const key = `${PHOTO_FOLDER}/${crypto.randomUUID()}.jpg`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: resized,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${getPublicBaseUrl()}/${key}`;
};

// Never throws: a failed photo cleanup must not block a deletion.
// Old Cloudinary links (and anything else) are simply ignored.
export const deletePhotoByUrl = async (fileUrl) => {
  if (!isPhotoStorageConfigured() || !isOwnPhotoUrl(fileUrl)) {
    return;
  }

  try {
    await getClient().send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: getPhotoKey(fileUrl),
      })
    );
  } catch (error) {
    console.error(
      "Photo deletion failed:",
      error?.message || error
    );
  }
};
