import cloudinary from "../config/cloudinary.js";

export const uploadProfilePhoto = async (req, res) => {
  try {


    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No photo uploaded",
      });
    }


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