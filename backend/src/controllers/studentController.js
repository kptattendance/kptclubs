import mongoose from "mongoose";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import Club from "../models/Club.js";
import ClubMembership from "../models/ClubMembership.js";
import Department from "../models/Department.js";
import Attendance from "../models/Attendance.js";
import Certificate from "../models/Certificate.js";
import { clerkClient } from "@clerk/express";
import {
  isOwnCloudinaryUrl,
  deleteCloudinaryImageByUrl,
} from "../utils/cloudinaryHelpers.js";

const isValidId = (value) =>
  typeof value === "string" &&
  mongoose.Types.ObjectId.isValid(value);

/*
=====================================================
DELETE STUDENT (ADMIN ONLY)
DELETE /api/student/:studentId
=====================================================
*/

export const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!isValidId(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const studentProfile =
      await StudentProfile.findById(studentId);

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const user = await User.findById(
      studentProfile.userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student user account not found",
      });
    }

    if (user.role !== "STUDENT") {
      return res.status(400).json({
        success: false,
        message: "The selected user is not a student",
      });
    }

    const clerkUserId = user.clerkUserId;

    const photoUrl =
      studentProfile.photoUrl || user.profilePhoto;

    await Promise.all([
      Attendance.deleteMany({
        studentId: studentProfile._id,
      }),
      Certificate.deleteMany({
        studentId: studentProfile._id,
      }),
      ClubMembership.deleteMany({
        studentId: studentProfile._id,
      }),
    ]);

    await StudentProfile.deleteOne({
      _id: studentProfile._id,
    });

    await User.deleteOne({
      _id: user._id,
    });

    if (clerkUserId) {
      try {
        await clerkClient.users.deleteUser(clerkUserId);
      } catch (clerkError) {
        console.error(
          "Clerk user deletion failed:",
          clerkError?.message || clerkError
        );
      }
    }

    await deleteCloudinaryImageByUrl(photoUrl);

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Delete student error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete student",
    });
  }
};

/*
=====================================================
REGISTER STUDENT (PUBLIC)
POST /api/student/register
=====================================================
*/

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,16}$/;
const REGISTER_NUMBER_PATTERN = /^[A-Z0-9][A-Z0-9/-]{2,29}$/;

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
    } = req.body || {};

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

    const badRequest = (message) =>
      res.status(400).json({
        success: false,
        message,
      });

    if (
      [name, email, phone, registerNumber, photoUrl].some(
        (value) => typeof value !== "string"
      )
    ) {
      return badRequest("Invalid student details");
    }

    const normalizedName = name
      .trim()
      .replace(/\s+/g, " ");

    const normalizedEmail = email.trim().toLowerCase();

    const normalizedPhone = phone.trim();

    const normalizedRegisterNumber = registerNumber
      .trim()
      .toUpperCase();

    const semesterNumber = Number(semester);

    const admissionYearNumber = Number(admissionYear);

    if (
      normalizedName.length < 2 ||
      normalizedName.length > 100
    ) {
      return badRequest(
        "Name must be between 2 and 100 characters"
      );
    }

    if (
      normalizedEmail.length > 254 ||
      !EMAIL_PATTERN.test(normalizedEmail)
    ) {
      return badRequest("Enter a valid email address");
    }

    if (!PHONE_PATTERN.test(normalizedPhone)) {
      return badRequest("Enter a valid phone number");
    }

    if (
      !REGISTER_NUMBER_PATTERN.test(
        normalizedRegisterNumber
      )
    ) {
      return badRequest("Enter a valid register number");
    }

    if (
      !Number.isInteger(semesterNumber) ||
      semesterNumber < 1 ||
      semesterNumber > 6
    ) {
      return badRequest("Semester must be between 1 and 6");
    }

    if (
      !Number.isInteger(admissionYearNumber) ||
      admissionYearNumber < 2000 ||
      admissionYearNumber > new Date().getFullYear() + 1
    ) {
      return badRequest("Enter a valid admission year");
    }

    if (!isValidId(departmentId) || !isValidId(clubId)) {
      return badRequest("Invalid department or club");
    }

    // The photo must be one uploaded through this application
    if (!isOwnCloudinaryUrl(photoUrl)) {
      return badRequest(
        "Invalid photo. Please upload the photo again"
      );
    }

    // =================================================
    // DUPLICATES, DEPARTMENT AND CLUB
    // =================================================

    const [
      existingUser,
      existingStudent,
      department,
      club,
    ] = await Promise.all([
      User.exists({ email: normalizedEmail }),
      StudentProfile.exists({
        registerNumber: normalizedRegisterNumber,
      }),
      Department.findById(departmentId).select("_id"),
      Club.findOne({
        _id: clubId,
        isActive: true,
      }).select("_id code name"),
    ]);

    if (existingUser) {
      return badRequest(
        "A student with this email already exists"
      );
    }

    if (existingStudent) {
      return badRequest(
        "This register number is already registered"
      );
    }

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    // =================================================
    // CREATE / FIND CLERK USER
    // =================================================

    let clerkUser = null;
    let clerkUserCreated = false;

    try {
      const clerkUsers =
        await clerkClient.users.getUserList({
          emailAddress: [normalizedEmail],
        });

      if (clerkUsers.data.length > 0) {
        clerkUser = clerkUsers.data[0];
      } else {
        // NO PASSWORD
        // Student will authenticate using Google.
        clerkUser = await clerkClient.users.createUser({
          emailAddress: [normalizedEmail],
          firstName: normalizedName,
          publicMetadata: {
            role: "STUDENT",
          },
        });

        clerkUserCreated = true;
      }
    } catch (clerkError) {
      console.error(
        "Clerk student creation error:",
        clerkError?.errors || clerkError?.message || clerkError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create student authentication account",
      });
    }

    // =================================================
    // CREATE USER, PROFILE AND CLUB APPLICATION
    // Roll back on failure so the student can try again.
    // =================================================

    let user = null;
    let studentProfile = null;
    let membership = null;

    try {
      user = await User.create({
        clerkUserId: clerkUser.id,
        email: normalizedEmail,
        name: normalizedName,
        phone: normalizedPhone,
        profilePhoto: photoUrl,
        userType: "STUDENT",
        role: "STUDENT",
        departmentId,
        clubId: null,
        isActive: true,
      });

      studentProfile = await StudentProfile.create({
        userId: user._id,
        registerNumber: normalizedRegisterNumber,
        phone: normalizedPhone,
        departmentId,
        semester: semesterNumber,
        admissionYear: admissionYearNumber,
        photoUrl,
        status: "ACTIVE",
      });

      membership = await ClubMembership.create({
        studentId: studentProfile._id,
        clubId,
        status: "PENDING_CLUB_APPROVAL",
      });
    } catch (createError) {
      console.error(
        "Student registration save error:",
        createError
      );

      if (studentProfile) {
        await StudentProfile.deleteOne({
          _id: studentProfile._id,
        }).catch(() => {});
      }

      if (user) {
        await User.deleteOne({
          _id: user._id,
        }).catch(() => {});
      }

      if (clerkUserCreated) {
        await clerkClient.users
          .deleteUser(clerkUser.id)
          .catch(() => {});
      }

      if (createError?.code === 11000) {
        return badRequest(
          "A student with this email or register number already exists"
        );
      }

      return res.status(500).json({
        success: false,
        message: "Failed to register student",
      });
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      success: true,

      message:
        "Student registration submitted successfully. Your application is waiting for Club Incharge approval.",

      student: {
        id: studentProfile._id,
        name: user.name,
        email: user.email,
        registerNumber: studentProfile.registerNumber,
        photoUrl: studentProfile.photoUrl,
      },

      membership: {
        id: membership._id,
        club: {
          id: club._id,
          code: club.code,
          name: club.name,
        },
        status: membership.status,
      },
    });
  } catch (error) {
    console.error("Student registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to register student",
    });
  }
};

/*
=====================================================
LOGGED-IN STUDENT APPLIES TO A CLUB
POST /api/student/club-registration
=====================================================
*/

const OPEN_MEMBERSHIP_STATUSES = [
  "PENDING_CLUB_APPROVAL",
  "PENDING_HOD_APPROVAL",
  "CONFIRMED",
];

export const registerForClub = async (req, res) => {
  try {
    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message: "Only students can register for a club",
      });
    }

    const { clubId } = req.body || {};

    if (!isValidId(clubId)) {
      return res.status(400).json({
        success: false,
        message: "Please select a club",
      });
    }

    const [studentProfile, club] = await Promise.all([
      StudentProfile.findOne({
        userId: req.userId,
      }).select("_id status"),
      Club.findOne({
        _id: clubId,
        isActive: true,
      }).select("_id code name"),
    ]);

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message:
          "Student profile not found. Please complete the registration form first",
      });
    }

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    const memberships = await ClubMembership.find({
      studentId: studentProfile._id,
    }).select("clubId status");

    const openMembership = memberships.find(
      (membership) =>
        OPEN_MEMBERSHIP_STATUSES.includes(membership.status)
    );

    if (openMembership) {
      return res.status(409).json({
        success: false,
        message:
          "You already have an active club registration",
      });
    }

    // Re-applying to a club that rejected an earlier application
    let membership = memberships.find(
      (item) => String(item.clubId) === String(club._id)
    );

    if (membership) {
      membership.status = "PENDING_CLUB_APPROVAL";
      membership.clubApprovedBy = null;
      membership.clubApprovedAt = null;
      membership.clubRejectionReason = null;
      membership.hodApprovedBy = null;
      membership.hodApprovedAt = null;
      membership.hodRejectionReason = null;
      membership.joinedAt = null;
      membership.leftAt = null;

      await membership.save();
    } else {
      membership = await ClubMembership.create({
        studentId: studentProfile._id,
        clubId: club._id,
        status: "PENDING_CLUB_APPROVAL",
      });
    }

    return res.status(201).json({
      success: true,

      message:
        "Club registration submitted. Your application is waiting for Club Incharge approval.",

      membership: {
        id: membership._id,
        club: {
          id: club._id,
          code: club.code,
          name: club.name,
        },
        status: membership.status,
      },
    });
  } catch (error) {
    console.error("Club registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to register for club",
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

