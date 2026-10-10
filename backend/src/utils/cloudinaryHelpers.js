import cloudinary from "../config/cloudinary.js";

// Only photos stored in this project's Cloudinary account are trusted
export const isOwnCloudinaryUrl = (fileUrl) => {
  if (typeof fileUrl !== "string" || !fileUrl) {
    return false;
  }

  try {
    const url = new URL(fileUrl);

    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith(
        `/${process.env.CLOUDINARY_CLOUD_NAME}/`
      )
    );
  } catch {
    return false;
  }
};

export const getCloudinaryPublicId = (fileUrl) => {
  if (!fileUrl) {
    return null;
  }

  try {
    const url = new URL(fileUrl);

    const parts = url.pathname.split("/");

    const uploadIndex = parts.indexOf("upload");

    if (uploadIndex === -1) {
      return null;
    }

    // Everything after "upload"
    const publicIdParts = parts.slice(uploadIndex + 1);

    // Remove version such as v1788429026
    if (
      publicIdParts[0] &&
      /^v\d+$/.test(publicIdParts[0])
    ) {
      publicIdParts.shift();
    }

    // Remove extension
    return publicIdParts
      .join("/")
      .replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

// Never throws: a failed photo cleanup must not block a deletion
export const deleteCloudinaryImageByUrl = async (fileUrl) => {
  if (!isOwnCloudinaryUrl(fileUrl)) {
    return;
  }

  const publicId = getCloudinaryPublicId(fileUrl);

  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (error) {
    console.error(
      "Cloudinary deletion failed:",
      error?.message || error
    );
  }
};
