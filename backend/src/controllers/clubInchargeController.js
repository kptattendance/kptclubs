import User from "../models/User.js";
import Club from "../models/Club.js";
import ClubMembership from "../models/ClubMembership.js";
import StudentProfile from "../models/StudentProfile.js";
import Attendance from "../models/Attendance.js";
import Certificate from "../models/Certificate.js";
import cloudinary from "../config/cloudinary.js";
import { clerkClient } from "@clerk/express";

/*
=====================================================
DELETE CLUB STUDENT COMPLETELY
DELETE /api/club-incharge/:clubCode/students/:studentId
=====================================================
*/

export const deleteClubStudent = async (req, res) => {
  try {

    console.log("========== DELETE CLUB STUDENT ==========");

    const { clubCode, studentId } = req.params;

    // =================================================
    // 1. FIND CLUB IN-CHARGE
    // =================================================

    const user = await User.findOne({
      clerkUserId: req.clerkUserId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Club In-charge user not found",
      });
    }

    // =================================================
    // 2. CHECK ROLE
    // =================================================

    if (user.role !== "CLUB_INCHARGE") {
      return res.status(403).json({
        success: false,
        message: "Only Club In-charge can delete students",
      });
    }

    // =================================================
    // 3. CHECK ASSIGNED CLUB
    // =================================================

    if (!user.clubId) {
      return res.status(400).json({
        success: false,
        message: "No club is assigned to this Club In-charge",
      });
    }

    // =================================================
    // 4. FIND CLUB
    // =================================================

    const club = await Club.findOne({
      code: clubCode.toUpperCase(),
      isActive: true,
    });

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    // =================================================
    // 5. SECURITY CHECK
    // =================================================

    if (
      club._id.toString() !==
      user.clubId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot delete students from another club",
      });
    }

    // =================================================
    // 6. FIND STUDENT PROFILE
    // =================================================

    const studentProfile =
      await StudentProfile.findById(studentId);

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // =================================================
    // 7. FIND MEMBERSHIP FOR THIS CLUB
    // =================================================

    const membership =
      await ClubMembership.findOne({
        studentId: studentProfile._id,
        clubId: club._id,
      });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "This student does not belong to your club",
      });
    }

    // =================================================
    // 8. FIND MONGO USER
    // =================================================

    const studentUser =
      await User.findById(
        studentProfile.userId
      );

    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: "Student user not found",
      });
    }

    // =================================================
    // 9. MAKE SURE IT IS A STUDENT
    // =================================================

    if (studentUser.role !== "STUDENT") {
      return res.status(400).json({
        success: false,
        message: "The selected user is not a student",
      });
    }

    // =================================================
    // 10. DELETE ALL ATTENDANCE
    // =================================================

    await Attendance.deleteMany({
      studentId: studentProfile._id,
    });

    console.log("Attendance deleted");

    // =================================================
    // 11. DELETE ALL CERTIFICATES
    // =================================================

    await Certificate.deleteMany({
      studentId: studentProfile._id,
    });

    console.log("Certificates deleted");

    // =================================================
    // 12. DELETE ALL CLUB MEMBERSHIPS
    // =================================================

    await ClubMembership.deleteMany({
      studentId: studentProfile._id,
    });

    console.log("Club memberships deleted");

    // =================================================
    // 13. DELETE STUDENT PROFILE
    // =================================================

    await StudentProfile.findByIdAndDelete(
      studentProfile._id
    );

    console.log("Student profile deleted");

    // =================================================
    // 14. DELETE CLOUDINARY PHOTO
    // =================================================

    if (studentUser.photoPublicId) {

      try {

        await cloudinary.uploader.destroy(
          studentUser.photoPublicId
        );

        console.log(
          "Cloudinary photo deleted"
        );

      } catch (error) {

        console.error(
          "Cloudinary deletion failed:",
          error
        );

        // Continue deletion
      }
    }

    // =================================================
    // 15. DELETE CLERK USER
    // =================================================

    if (studentUser.clerkUserId) {

      try {

        await clerkClient.users.deleteUser(
          studentUser.clerkUserId
        );

        console.log(
          "Clerk user deleted:",
          studentUser.clerkUserId
        );

      } catch (error) {

        // If Clerk user is already missing,
        // continue with MongoDB deletion.

        if (error?.status === 404) {

          console.log(
            "Clerk user already does not exist:",
            studentUser.clerkUserId
          );

        } else {

          console.error(
            "Clerk deletion failed:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to delete student from Clerk",
          });
        }
      }
    }

    // =================================================
    // 16. DELETE MONGO USER
    // =================================================

    await User.findByIdAndDelete(
      studentUser._id
    );

    console.log("Mongo user deleted");

    // =================================================
    // SUCCESS
    // =================================================

    return res.status(200).json({
      success: true,
      message:
        "Student and all related data deleted successfully",
    });

  } catch (error) {

    console.error(
      "Delete club student error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete student",
    });
  }
};

/*
=====================================================
GET CLUB IN-CHARGE APPLICATIONS
GET /api/club-incharge/:clubCode/applications
=====================================================

Flow:

Clerk ID
   ↓
MongoDB User
   ↓
User.clubId
   ↓
Club
   ↓
Pending student applications
*/

export const getClubApplications = async (req, res) => {
  try {
    console.log("========== CLUB APPLICATIONS ==========");

    // =================================================
    // 1. GET CLERK USER ID
    // =================================================

    const clerkUserId = req.clerkUserId;

    console.log("Clerk User ID:", clerkUserId);

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // =================================================
    // 2. FIND MONGODB USER
    // =================================================

    const user = await User.findOne({
      clerkUserId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Application user not found",
      });
    }

    console.log("Mongo User ID:", user._id);
    console.log("Role:", user.role);
    console.log("Mongo Club ID:", user.clubId);

    // =================================================
    // 3. CHECK ROLE
    // =================================================

    if (user.role !== "CLUB_INCHARGE") {
      return res.status(403).json({
        success: false,
        message: "Only Club In-charge can view applications",
      });
    }

    // =================================================
    // 4. CHECK CLUB ASSIGNMENT
    // =================================================

    if (!user.clubId) {
      return res.status(400).json({
        success: false,
        message: "No club is assigned to this Club In-charge",
      });
    }

    // =================================================
    // 5. GET CLUB
    // =================================================

    const club = await Club.findById(user.clubId).select(
      "_id code name type description"
    );

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Assigned club not found",
      });
    }

    // =================================================
    // 6. GET PENDING APPLICATIONS
    // =================================================

    const applications = await ClubMembership.find({
      clubId: user.clubId,
      status: "PENDING_CLUB_APPROVAL",
    })
      .populate({
        path: "studentId",
        select:
          "userId registerNumber phone departmentId semester admissionYear photoUrl status",
        populate: {
          path: "departmentId",
          select: "code name",
        },
      })
      .sort({
        createdAt: -1,
      });

    // =================================================
    // 7. GET USER DETAILS FOR EACH STUDENT
    // =================================================

    const formattedApplications = await Promise.all(
      applications.map(async (application) => {
        const studentProfile =
          application.studentId;

        if (!studentProfile) {
          return null;
        }

        const studentUser =
          await User.findById(
            studentProfile.userId
          ).select(
            "_id name email phone profilePhoto"
          );

        if (!studentUser) {
          return null;
        }

        return {
          membershipId:
            application._id,

          status:
            application.status,

          appliedAt:
            application.createdAt,

          student: {
            userId:
              studentUser._id,

            name:
              studentUser.name,

            email:
              studentUser.email,

            phone:
              studentUser.phone ||
              studentProfile.phone,

            registerNumber:
              studentProfile.registerNumber,

            semester:
              studentProfile.semester,

            admissionYear:
              studentProfile.admissionYear,

            photoUrl:
              studentProfile.photoUrl ||
              studentUser.profilePhoto,

            status:
              studentProfile.status,

            department:
              studentProfile.departmentId,
          },
        };
      })
    );

    // Remove null entries
    const validApplications =
      formattedApplications.filter(
        Boolean
      );

    // =================================================
    // 8. RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      club: {
        id: club._id,
        code: club.code,
        name: club.name,
        type: club.type,
        description: club.description,
      },

      applications:
        validApplications,

      count:
        validApplications.length,
    });

  } catch (error) {

    console.error(
      "Get club applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load club applications",
    });
  }
};


/*
=====================================================
APPROVE STUDENT APPLICATION
PATCH /api/club-incharge/applications/:membershipId/approve
=====================================================

After Club In-charge approval:

PENDING_CLUB_APPROVAL
          ↓
PENDING_HOD_APPROVAL

The application is NOT confirmed yet.

HOD must approve it.
=====================================================
*/

export const approveClubApplication = async (
  req,
  res
) => {
  try {

    console.log(
      "========== APPROVE CLUB APPLICATION =========="
    );

    const clerkUserId =
      req.clerkUserId;

    const { membershipId } =
      req.params;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!membershipId) {
      return res.status(400).json({
        success: false,
        message:
          "Membership ID is required",
      });
    }

    // =================================================
    // 1. FIND MONGODB USER USING CLERK ID
    // =================================================

    const user = await User.findOne({
      clerkUserId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Application user not found",
      });
    }

    // =================================================
    // 2. CHECK ROLE
    // =================================================

    if (user.role !== "CLUB_INCHARGE") {
      return res.status(403).json({
        success: false,
        message:
          "Only Club In-charge can approve applications",
      });
    }

    // =================================================
    // 3. CHECK CLUB
    // =================================================

    if (!user.clubId) {
      return res.status(400).json({
        success: false,
        message:
          "No club assigned to this Club In-charge",
      });
    }

    // =================================================
    // 4. FIND MEMBERSHIP
    // =================================================

    const membership =
      await ClubMembership.findById(
        membershipId
      );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message:
          "Club application not found",
      });
    }

    // =================================================
    // 5. SECURITY CHECK
    // =================================================
    // Make sure this application belongs
    // to this Club In-charge's club.

    if (
      membership.clubId.toString() !==
      user.clubId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot approve an application for another club",
      });
    }

    // =================================================
    // 6. CHECK APPLICATION STATUS
    // =================================================

    if (
      membership.status !==
      "PENDING_CLUB_APPROVAL"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This application is not waiting for Club In-charge approval",
      });
    }

    // =================================================
    // 7. UPDATE APPLICATION
    // =================================================

    membership.status =
      "PENDING_HOD_APPROVAL";

    membership.clubApprovedBy =
      user._id;

    membership.clubApprovedAt =
      new Date();

    membership.clubRejectionReason =
      null;

    await membership.save();

    // =================================================
    // 8. RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      message:
        "Application approved by Club In-charge and sent to HOD for approval",

      membership: {
        id: membership._id,

        status:
          membership.status,

        clubApprovedBy:
          membership.clubApprovedBy,

        clubApprovedAt:
          membership.clubApprovedAt,
      },
    });

  } catch (error) {

    console.error(
      "Approve club application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to approve club application",
    });
  }
};


/*
=====================================================
REJECT STUDENT APPLICATION
PATCH /api/club-incharge/applications/:membershipId/reject
=====================================================
*/

export const rejectClubApplication = async (
  req,
  res
) => {
  try {

    const clerkUserId =
      req.clerkUserId;

    const { membershipId } =
      req.params;

    const {
      reason,
    } = req.body;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    if (!membershipId) {
      return res.status(400).json({
        success: false,
        message:
          "Membership ID is required",
      });
    }

    // =================================================
    // FIND MONGODB USER
    // =================================================

    const user =
      await User.findOne({
        clerkUserId,
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Application user not found",
      });
    }

    // =================================================
    // CHECK ROLE
    // =================================================

    if (user.role !== "CLUB_INCHARGE") {
      return res.status(403).json({
        success: false,
        message:
          "Only Club In-charge can reject applications",
      });
    }

    // =================================================
    // CHECK CLUB
    // =================================================

    if (!user.clubId) {
      return res.status(400).json({
        success: false,
        message:
          "No club assigned to this Club In-charge",
      });
    }

    // =================================================
    // FIND MEMBERSHIP
    // =================================================

    const membership =
      await ClubMembership.findById(
        membershipId
      );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message:
          "Club application not found",
      });
    }

    // =================================================
    // SECURITY CHECK
    // =================================================

    if (
      membership.clubId.toString() !==
      user.clubId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot reject an application for another club",
      });
    }

    // =================================================
    // CHECK STATUS
    // =================================================

    if (
      membership.status !==
      "PENDING_CLUB_APPROVAL"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This application is not waiting for Club In-charge approval",
      });
    }

    // =================================================
    // UPDATE
    // =================================================

    membership.status =
      "REJECTED_BY_CLUB";

    membership.clubApprovedBy =
      user._id;

    membership.clubApprovedAt =
      new Date();

    membership.clubRejectionReason =
      reason?.trim() ||
      "Application rejected by Club In-charge";

    await membership.save();

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      message:
        "Student club application rejected",

      membership: {
        id:
          membership._id,

        status:
          membership.status,

        clubRejectionReason:
          membership.clubRejectionReason,
      },
    });

  } catch (error) {

    console.error(
      "Reject club application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reject club application",
    });
  }
};


/*
=====================================================
GET CLUB STUDENTS
GET /api/club-incharge/:clubCode/students
=====================================================
*/

export const getClubStudents = async (req, res) => {
  try {
    const { clubCode } = req.params;

    // ================================================
    // CHECK CLUB
    // ================================================

    const club = await Club.findOne({
      code: clubCode.toUpperCase(),
      isActive: true,
    });

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    // ================================================
    // GET CONFIRMED CLUB MEMBERS
    // ================================================

    const memberships = await ClubMembership.find({
      clubId: club._id,
      status: "CONFIRMED",
    })
      .populate({
        path: "studentId",
        populate: [
          {
            path: "userId",
            select: "name email phone profilePhoto",
          },
          {
            path: "departmentId",
            select: "code name",
          },
        ],
      })
      .sort({ createdAt: -1 });

    // ================================================
    // FORMAT RESPONSE
    // ================================================

    const students = memberships
      .filter(
        (membership) =>
          membership.studentId &&
          membership.studentId.userId
      )
      .map((membership) => {
        const student = membership.studentId;
        const user = student.userId;

        return {
          id: student._id,

          name: user.name,

          email: user.email,

          phone: student.phone || user.phone,

          registerNumber:
            student.registerNumber,

          semester:
            student.semester,

          admissionYear:
            student.admissionYear,

          photoUrl:
            student.photoUrl ||
            user.profilePhoto,

          department: student.departmentId
            ? {
                id: student.departmentId._id,
                code: student.departmentId.code,
                name: student.departmentId.name,
              }
            : null,

          joinedAt:
            membership.joinedAt,

        };
      });

    return res.status(200).json({
      success: true,

      club: {
        id: club._id,
        code: club.code,
        name: club.name,
      },

      totalStudents: students.length,

      students,
    });

  } catch (error) {

    console.error(
      "Get club students error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load club students",
    });
  }
};