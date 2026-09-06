import cloudinary from "../config/cloudinary.js";

export const uploadProfilePhoto = async (req, res) => {
  try {
    console.log("========== PHOTO UPLOAD ==========");
    console.log("File exists:", !!req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No photo uploaded",
      });
    }

    console.log("File name:", req.file.originalname);
    console.log("File type:", req.file.mimetype);
    console.log("File size:", req.file.size);

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "kpt-club/users",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.error(
              "Cloudinary callback error:",
              error
            );

            reject(error);
            return;
          }

          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    console.log(
      "Cloudinary URL:",
      result.secure_url
    );

    return res.status(200).json({
      success: true,
      photoUrl: result.secure_url,
    });

  } catch (error) {
    console.error(
      "========== CLOUDINARY ERROR =========="
    );

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload photo",
    });
  }
};