import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import {
  isPhotoStorageConfigured,
  uploadPhoto,
  deletePhotoByUrl,
} from "../utils/photoStorage.js";

const storePhoto = async (req, res) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: "No photo uploaded",
    });

    return null;
  }

  if (!isPhotoStorageConfigured()) {
    console.error("Photo storage (R2) is not configured");

    res.status(503).json({
      success: false,
      message: "Photo upload is not available right now",
    });

    return null;
  }

  try {
    return await uploadPhoto(req.file.buffer);
  } catch (error) {
    if (error?.code === "INVALID_IMAGE") {
      res.status(400).json({
        success: false,
        message: error.message,
      });

      return null;
    }

    console.error(
      "Photo upload error:",
      error?.message || error
    );

    res.status(500).json({
      success: false,
      message: "Failed to upload photo",
    });

    return null;
  }
};

/*
=====================================================
UPLOAD A PHOTO (registration form / admin new user)
POST /api/uploads/profile-photo
=====================================================
*/

export const uploadProfilePhoto = async (req, res) => {
  const photoUrl = await storePhoto(req, res);

  if (!photoUrl) {
    return;
  }

  return res.status(200).json({
    success: true,
    photoUrl,
  });
};

/*
=====================================================
LOGGED-IN STUDENT REPLACES THEIR OWN PHOTO
PUT /api/student/photo
=====================================================
*/

export const updateStudentPhoto = async (req, res) => {
  try {
    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message: "Only students can update their photo",
      });
    }

    const studentProfile = await StudentProfile.findOne({
      userId: req.userId,
    });

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const photoUrl = await storePhoto(req, res);

    if (!photoUrl) {
      return;
    }

    const oldPhotoUrl = studentProfile.photoUrl;

    try {
      studentProfile.photoUrl = photoUrl;

      await studentProfile.save();

      await User.updateOne(
        { _id: req.userId },
        { $set: { profilePhoto: photoUrl } }
      );
    } catch (saveError) {
      // Do not leave an unused file behind
      await deletePhotoByUrl(photoUrl);

      throw saveError;
    }

    if (oldPhotoUrl !== photoUrl) {
      await deletePhotoByUrl(oldPhotoUrl);
    }

    return res.status(200).json({
      success: true,
      message: "Photo updated successfully",
      photoUrl,
    });
  } catch (error) {
    console.error("Update student photo error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update photo",
    });
  }
};
