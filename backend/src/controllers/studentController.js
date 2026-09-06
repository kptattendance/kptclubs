import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import Club from "../models/Club.js";
import ClubMembership from "../models/ClubMembership.js";
import Department from "../models/Department.js";
import { clerkClient } from "@clerk/express";
import cloudinary from "../config/cloudinary.js";

const getCloudinaryPublicId = (photoUrl) => {

  if (!photoUrl) {
    return null;
  }

  try {

    const url = new URL(photoUrl);

    const parts =
      url.pathname.split("/");

    const uploadIndex =
      parts.indexOf("upload");

    if (uploadIndex === -1) {
      return null;
    }

    // Everything after "upload"
    let publicIdParts =
      parts.slice(uploadIndex + 1);

    // Remove version such as v1788429026
    if (
      publicIdParts[0] &&
      /^v\d+$/.test(publicIdParts[0])
    ) {
      publicIdParts.shift();
    }

    let publicId =
      publicIdParts.join("/");

    // Remove extension
    publicId =
      publicId.replace(
        /\.[^/.]+$/,
        ""
      );

    return publicId;

  } catch (error) {

    console.error(
      "Cloudinary public ID extraction error:",
      error
    );

    return null;
  }
};

export const deleteStudent = async (req, res) => {

  try {

    const studentId =
      req.params.studentId;

    console.log(
      "========== DELETE STUDENT =========="
    );

    console.log(
      "Student ID:",
      studentId
    );

    // =================================================
    // FIND STUDENT PROFILE
    // =================================================

    const studentProfile =
      await StudentProfile.findById(
        studentId
      );

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // =================================================
    // FIND MONGO USER
    // =================================================

    const user =
      await User.findById(
        studentProfile.userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Student user account not found",
      });
    }

    // =================================================
    // SAVE IDs BEFORE DELETION
    // =================================================

    const clerkUserId =
      user.clerkUserId;

    const photoUrl =
      studentProfile.photoUrl ||
      user.profilePhoto;

    // =================================================
    // DELETE CLUB MEMBERSHIPS
    // =================================================

    await ClubMembership.deleteMany({
      studentId:
        studentProfile._id,
    });

    // =================================================
    // DELETE STUDENT PROFILE
    // =================================================

    await StudentProfile.deleteOne({
      _id:
        studentProfile._id,
    });

    // =================================================
    // DELETE MONGO USER
    // =================================================

    await User.deleteOne({
      _id:
        user._id,
    });

    // =================================================
    // DELETE CLERK USER
    // =================================================

    if (clerkUserId) {

      try {

        await clerkClient.users.deleteUser(
          clerkUserId
        );

        console.log(
          "Clerk user deleted:",
          clerkUserId
        );

      } catch (clerkError) {

        console.error(
          "Clerk user deletion failed:",
          clerkError
        );

      }
    }

    // =================================================
    // DELETE CLOUDINARY PHOTO
    // =================================================

    if (photoUrl) {

      const publicId =
        getCloudinaryPublicId(
          photoUrl
        );

      if (publicId) {

        try {

          await cloudinary.uploader.destroy(
            publicId,
            {
              resource_type: "image",
            }
          );

          console.log(
            "Cloudinary image deleted:",
            publicId
          );

        } catch (cloudinaryError) {

          console.error(
            "Cloudinary deletion failed:",
            cloudinaryError
          );

        }
      }
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({

      success: true,

      message:
        "Student deleted successfully",

    });

  } catch (error) {

    console.error(
      "========== DELETE STUDENT ERROR =========="
    );

    console.error(error);

    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "Failed to delete student",

    });
  }
};
/*
=====================================================
UPLOAD BUFFER TO CLOUDINARY
=====================================================
*/
/*
=====================================================
REGISTER STUDENT
=====================================================
*/

export const registerStudent = async (req, res) => {
  try {

    const {
      name,
      email,
      phone,
      registerNumber,
      departmentId,
      semester,
      admissionYear,
      clubId,
      photoUrl,
    } = req.body;


    // =================================================
    // VALIDATION
    // =================================================

    if (
      !name ||
      !email ||
      !phone ||
      !registerNumber ||
      !departmentId ||
      !semester ||
      !admissionYear ||
      !clubId ||
      !photoUrl
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All student details including photo are required",
      });
    }


    // =================================================
    // NORMALIZE DATA
    // =================================================

    const normalizedEmail =
      email.trim().toLowerCase();

    const normalizedRegisterNumber =
      registerNumber.trim().toUpperCase();


    // =================================================
    // CHECK MONGO EMAIL
    // =================================================

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "A student with this email already exists",
      });
    }


    // =================================================
    // CHECK REGISTER NUMBER
    // =================================================

    const existingStudent =
      await StudentProfile.findOne({
        registerNumber:
          normalizedRegisterNumber,
      });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message:
          "This register number is already registered",
      });
    }


    // =================================================
    // CHECK DEPARTMENT
    // =================================================

    const department =
      await Department.findById(departmentId);

    if (!department) {
      return res.status(404).json({
        success: false,
        message:
          "Department not found",
      });
    }


    // =================================================
    // CHECK CLUB
    // =================================================

    const club =
      await Club.findOne({
        _id: clubId,
        isActive: true,
      });

    if (!club) {
      return res.status(404).json({
        success: false,
        message:
          "Club not found",
      });
    }


    // =================================================
    // CREATE / FIND CLERK USER
    // =================================================

    let clerkUser = null;

    try {

      // -------------------------------------------------
      // Check whether this email already exists in Clerk
      // -------------------------------------------------

      const clerkUsers =
        await clerkClient.users.getUserList({
          emailAddress: [normalizedEmail],
        });


      if (clerkUsers.data.length > 0) {

        clerkUser =
          clerkUsers.data[0];

        console.log(
          "Existing Clerk user found:",
          clerkUser.id
        );

      } else {

        // -------------------------------------------------
        // Create new Clerk user
        //
        // NO PASSWORD
        // Student will authenticate using Google.
        // -------------------------------------------------

        clerkUser =
          await clerkClient.users.createUser({

            emailAddress: [
              normalizedEmail,
            ],

            firstName:
              name.trim(),

            publicMetadata: {
              role: "STUDENT",
            },

          });


        console.log(
          "New Clerk student created:",
          clerkUser.id
        );
      }

    } catch (clerkError) {

      console.error(
        "Clerk student creation error:",
        clerkError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create student authentication account",
      });
    }


    // =================================================
    // CREATE MONGO USER
    // =================================================

    const user =
      await User.create({

        // IMPORTANT:
        // This is the CLERK ID
        clerkUserId:
          clerkUser.id,

        email:
          normalizedEmail,

        name:
          name.trim(),

        phone:
          phone.trim(),

        profilePhoto:
          photoUrl,

        userType:
          "STUDENT",

        // MongoDB application role
        role:
          "STUDENT",

        departmentId:
          departmentId,

        clubId:
          null,

        isActive:
          true,

      });


    // =================================================
    // CREATE STUDENT PROFILE
    // =================================================

    const studentProfile =
      await StudentProfile.create({

        // IMPORTANT:
        // This is MongoDB User._id
        userId:
          user._id,

        registerNumber:
          normalizedRegisterNumber,

        phone:
          phone.trim(),

        departmentId:
          departmentId,

        semester:
          Number(semester),

        admissionYear:
          Number(admissionYear),

        photoUrl:
          photoUrl,

        status:
          "ACTIVE",

      });


    // =================================================
    // CREATE CLUB APPLICATION
    // =================================================

    const membership =
      await ClubMembership.create({

        // MongoDB StudentProfile._id
        studentId:
          studentProfile._id,

        // MongoDB Club._id
        clubId:
          clubId,

        status:
          "PENDING_CLUB_APPROVAL",

      });


    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({

      success: true,

      message:
        "Student registration submitted successfully. Your application is waiting for Club Incharge approval.",

      student: {

        // MongoDB StudentProfile ID
        id:
          studentProfile._id,

        // MongoDB User ID
        userId:
          user._id,

        // Clerk ID
        clerkUserId:
          user.clerkUserId,

        name:
          user.name,

        email:
          user.email,

        registerNumber:
          studentProfile.registerNumber,

        photoUrl:
          studentProfile.photoUrl,

      },

      membership: {

        // MongoDB ClubMembership ID
        id:
          membership._id,

        club: {

          id:
            club._id,

          code:
            club.code,

          name:
            club.name,

        },

        status:
          membership.status,

      },

    });

  } catch (error) {

    console.error(
      "========== STUDENT REGISTRATION ERROR =========="
    );

    console.error(error);

    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "Failed to register student",

    });

  }
};

/*
=====================================================
GET LOGGED-IN STUDENT PROFILE
GET /api/student/profile
=====================================================
*/
export const getStudentProfile = async (req, res) => {
  try {

    console.log("========== STUDENT PROFILE ==========");
    console.log("Clerk User ID:", req.clerkUserId);
    console.log("Mongo User ID:", req.userId);

    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Application user not found",
      });
    }

    if (user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message: "Only students can access this page",
      });
    }

    const studentProfile =
      await StudentProfile.findOne({
        userId: user._id,
      }).populate(
        "departmentId",
        "code name"
      );

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const membership =
      await ClubMembership.findOne({
        studentId: studentProfile._id,
      })
        .sort({ createdAt: -1 })
        .populate(
          "clubId",
          "code name type description"
        );

    return res.status(200).json({

      success: true,

      student: {

        id: studentProfile._id,

        // MongoDB User ID
        userId: user._id,

        // Clerk ID
        clerkUserId: user.clerkUserId,

        name: user.name,

        email: user.email,

        phone: studentProfile.phone,

        registerNumber:
          studentProfile.registerNumber,

        semester:
          studentProfile.semester,

        admissionYear:
          studentProfile.admissionYear,

        status:
          studentProfile.status,

        photoUrl:
          studentProfile.photoUrl,

        department:
          studentProfile.departmentId,

        membership: membership
          ? {

              id: membership._id,

              club: membership.clubId,

              status:
                membership.status,

              clubApprovedBy:
                membership.clubApprovedBy,

              clubApprovedAt:
                membership.clubApprovedAt,

              hodApprovedBy:
                membership.hodApprovedBy,

              hodApprovedAt:
                membership.hodApprovedAt,

              joinedAt:
                membership.joinedAt,appliedAt:
        membership.createdAt,


            }
          : null,

      },

    });

  } catch (error) {

    console.error(
      "Get student profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load student profile",
    });
  }
};

/*
=====================================================
GET AVAILABLE CLUBS
GET /api/student/clubs
=====================================================
*/

export const getStudentClubs = async (
  req,
  res
) => {
  try {

    const clubs = await Club.find({
      isActive: true,
    })
      .select("_id code name description type")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      clubs,
    });

  } catch (error) {

    console.error(
      "Get student clubs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load clubs",
    });
  }
};

