

import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import ClubMembership from "../models/ClubMembership.js";
import Club from "../models/Club.js";
import Department from "../models/Department.js";

export const getHODDepartmentStudents = async (req, res) => {
  try {

    console.log("========== HOD DEPARTMENT STUDENTS ==========");

    // MongoDB User document
    const hod = req.user;

    console.log("Mongo User ID:", hod?._id);
    console.log("Role:", hod?.role);
    console.log("Department ID:", hod?.departmentId);


    // =================================================
    // CHECK USER
    // =================================================

    if (!hod) {
      return res.status(401).json({
        success: false,
        message: "Application user not found",
      });
    }


    // =================================================
    // CHECK ROLE
    // =================================================

    if (hod.role !== "HOD") {
      return res.status(403).json({
        success: false,
        message: "Only HOD can access department students",
      });
    }


    // =================================================
    // CHECK DEPARTMENT
    // =================================================

    if (!hod.departmentId) {
      return res.status(400).json({
        success: false,
        message: "HOD is not assigned to a department",
      });
    }


    // =================================================
    // GET HOD DEPARTMENT
    // =================================================

    const department = await Department.findById(
      hod.departmentId
    ).select("_id code name");


    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }


    // =================================================
    // GET ONLY STUDENTS FROM HOD DEPARTMENT
    // =================================================

    const students =
      await StudentProfile.find({

        departmentId: hod.departmentId,

      })
        .populate(
          "userId",
          "name email phone profilePhoto isActive"
        )
        .populate(
          "departmentId",
          "code name"
        )
        .sort({
          createdAt: -1,
        });


    // =================================================
    // GET CLUB MEMBERSHIPS
    // =================================================

    const studentIds =
      students.map(
        (student) => student._id
      );


    const memberships =
      await ClubMembership.find({

        studentId: {
          $in: studentIds,
        },

      }).populate(
        "clubId",
        "code name"
      );


    // =================================================
    // CREATE MEMBERSHIP MAP
    // =================================================

    const membershipMap = new Map();


    memberships.forEach((membership) => {

      membershipMap.set(
        membership.studentId.toString(),
        membership
      );

    });


    // =================================================
    // FORMAT RESPONSE
    // =================================================

    const formattedStudents =
      students.map((student) => {

        const membership =
          membershipMap.get(
            student._id.toString()
          );


        return {

          _id:
            student._id,

          name:
            student.userId?.name || "",

          email:
            student.userId?.email || "",

          phone:
            student.phone ||
            student.userId?.phone ||
            "",

          profilePhoto:
            student.photoUrl ||
            student.userId?.profilePhoto ||
            null,

          registerNumber:
            student.registerNumber,

          semester:
            student.semester,

          admissionYear:
            student.admissionYear,

          department:
            student.departmentId
              ? {
                  _id:
                    student.departmentId._id,

                  code:
                    student.departmentId.code,

                  name:
                    student.departmentId.name,
                }
              : null,

          club:
            membership?.clubId
              ? {
                  _id:
                    membership.clubId._id,

                  code:
                    membership.clubId.code,

                  name:
                    membership.clubId.name,
                }
              : null,

          clubStatus:
            membership?.status || null,

          isActive:
            student.userId?.isActive ?? true,

        };

      });


    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({

      success: true,

      department: {

        _id:
          department._id,

        code:
          department.code,

        name:
          department.name,

      },

      count:
        formattedStudents.length,

      students:
        formattedStudents,

    });


  } catch (error) {

    console.error(
      "========== HOD STUDENTS ERROR =========="
    );

    console.error(error);

    return res.status(500).json({

      success: false,

      message:
        "Failed to load department students",

    });

  }
};

export const getHODDashboard = async (req, res) => {
  try {

    console.log("========== HOD DASHBOARD ==========");

    // req.user is the MongoDB User
    // provided by resolveUser middleware

    const hod = req.user;

    if (!hod) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("Mongo User ID:", hod._id);
    console.log("Role:", hod.role);
    console.log("Department ID:", hod.departmentId);


    // =================================================
    // CHECK HOD
    // =================================================

    if (hod.role !== "HOD") {
      return res.status(403).json({
        success: false,
        message: "Only HOD can access this dashboard",
      });
    }


    // =================================================
    // DEPARTMENT
    // =================================================

    await hod.populate(
      "departmentId",
      "code name"
    );

    const department = hod.departmentId;

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "HOD department not assigned",
      });
    }


    // =================================================
    // DEPARTMENT STUDENTS
    // =================================================

    const students =
      await StudentProfile.find({
        departmentId: department._id,
        status: "ACTIVE",
      })
      .populate(
        "userId",
        "name email phone profilePhoto"
      )
      .select(
        "registerNumber semester admissionYear photoUrl userId"
      );


    const totalStudents = students.length;


    // =================================================
    // ACTIVE CLUBS
    // =================================================

    const clubs =
      await Club.find({
        isActive: true,
      })
      .select(
        "_id code name description type"
      )
      .sort({
        name: 1,
      });


    // =================================================
    // CLUB-WISE DEPARTMENT STUDENT COUNT
    // =================================================

    const clubStatistics = [];


    for (const club of clubs) {

      // Find memberships belonging to
      // students from this HOD's department

      const memberships =
        await ClubMembership.find({
          clubId: club._id,
          status: "CONFIRMED",
        })
        .populate({
          path: "studentId",
          match: {
            departmentId: department._id,
          },
          select: "departmentId",
        });


      // Remove memberships where the student
      // belongs to another department

      const departmentMembers =
        memberships.filter(
          (membership) =>
            membership.studentId !== null
        );


      clubStatistics.push({
        id: club._id,
        code: club.code,
        name: club.name,
        type: club.type,
        description: club.description || "",
        studentCount:
          departmentMembers.length,
      });
    }


    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({

      success: true,

      hod: {
        id: hod._id,
        name: hod.name,
        email: hod.email,
        phone: hod.phone || "",
        profilePhoto:
          hod.profilePhoto || "",
        role: hod.role,

        department: {
          id: department._id,
          code: department.code,
          name: department.name,
        },
      },

      stats: {
        totalStudents,
        totalClubs: clubs.length,

        confirmedMembers:
          clubStatistics.reduce(
            (total, club) =>
              total + club.studentCount,
            0
          ),
      },

      clubs: clubStatistics,

    });

  } catch (error) {

    console.error(
      "HOD dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load HOD dashboard",
    });
  }
};
/*
=====================================================
GET PENDING HOD APPLICATIONS
GET /api/hod/applications
=====================================================
*/

export const getHODApplications = async (req, res) => {
  try {
    console.log("========== HOD APPLICATIONS ==========");

    const clerkUserId = req.clerkUserId;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ================================================
    // FIND LOGGED-IN HOD
    // ================================================

    const user = await User.findOne({
      clerkUserId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ================================================
    // CHECK ROLE
    // ================================================

    if (user.role !== "HOD") {
      return res.status(403).json({
        success: false,
        message: "Only HOD can view applications",
      });
    }

    // ================================================
    // CHECK DEPARTMENT
    // ================================================

    if (!user.departmentId) {
      return res.status(400).json({
        success: false,
        message: "No department assigned to this HOD",
      });
    }

    // ================================================
    // FIND APPLICATIONS
    // ================================================

    const applications =
      await ClubMembership.find({
        status: "PENDING_HOD_APPROVAL",
      })
        .populate({
          path: "studentId",
          match: {
            departmentId: user.departmentId,
          },
          populate: {
            path: "departmentId",
            select: "code name",
          },
        })
        .populate(
          "clubId",
          "code name type description"
        )
        .sort({
          createdAt: -1,
        });

    // Remove applications where student
    // did not belong to HOD's department.

    const filteredApplications =
      applications.filter(
        (application) =>
          application.studentId
      );

    // ================================================
    // FORMAT RESPONSE
    // ================================================

    const formattedApplications =
      await Promise.all(
        filteredApplications.map(
          async (membership) => {

            const student =
              membership.studentId;

            const studentUser =
              await User.findById(
                student.userId
              );

            return {
              membershipId:
                membership._id,

              status:
                membership.status,

              appliedAt:
                membership.createdAt,

              student: {
                userId:
                  studentUser?._id,

                name:
                  studentUser?.name || "",

                email:
                  studentUser?.email || "",

                phone:
                  student.phone || "",

                registerNumber:
                  student.registerNumber,

                semester:
                  student.semester,

                admissionYear:
                  student.admissionYear,

                photoUrl:
                  student.photoUrl,

                status:
                  student.status,

                department:
                  student.departmentId,
              },

              club: membership.clubId,
            };
          }
        )
      );

    return res.status(200).json({
      success: true,

      count:
        formattedApplications.length,

      applications:
        formattedApplications,
    });

  } catch (error) {

    console.error(
      "Get HOD applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load HOD applications",
    });
  }
};


/*
=====================================================
APPROVE HOD APPLICATION
PUT /api/hod/applications/:membershipId/approve
=====================================================
*/

export const approveHODApplication =
  async (req, res) => {

    try {

      console.log(
        "========== APPROVE HOD APPLICATION =========="
      );

      const clerkUserId =
        req.clerkUserId;

      if (!clerkUserId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const {
        membershipId,
      } = req.params;

      // ==============================================
      // FIND HOD
      // ==============================================

      const user =
        await User.findOne({
          clerkUserId,
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.role !== "HOD") {
        return res.status(403).json({
          success: false,
          message:
            "Only HOD can approve applications",
        });
      }

      if (!user.departmentId) {
        return res.status(400).json({
          success: false,
          message:
            "No department assigned to this HOD",
        });
      }

      // ==============================================
      // FIND MEMBERSHIP
      // ==============================================

      const membership =
        await ClubMembership.findById(
          membershipId
        ).populate("studentId");

      if (!membership) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found",
        });
      }

      // ==============================================
      // CHECK STUDENT DEPARTMENT
      // ==============================================

      if (
        membership.studentId.departmentId.toString() !==
        user.departmentId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot approve applications from another department",
        });
      }

      // ==============================================
      // CHECK STATUS
      // ==============================================

      if (
        membership.status !==
        "PENDING_HOD_APPROVAL"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This application is not waiting for HOD approval",
        });
      }

      // ==============================================
      // APPROVE
      // ==============================================

      membership.status =
        "CONFIRMED";

      membership.hodApprovedBy =
        user._id;

      membership.hodApprovedAt =
        new Date();

      membership.hodRejectionReason =
        null;

      membership.joinedAt =
        new Date();

      await membership.save();

      return res.status(200).json({
        success: true,

        message:
          "Student application approved successfully",

        membership,
      });

    } catch (error) {

      console.error(
        "Approve HOD application error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to approve student application",
      });
    }
  };


/*
=====================================================
REJECT HOD APPLICATION
PUT /api/hod/applications/:membershipId/reject
=====================================================
*/

export const rejectHODApplication =
  async (req, res) => {

    try {

      const clerkUserId =
        req.clerkUserId;

      if (!clerkUserId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const {
        membershipId,
      } = req.params;

      const {
        reason,
      } = req.body;

      // ==============================================
      // FIND HOD
      // ==============================================

      const user =
        await User.findOne({
          clerkUserId,
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.role !== "HOD") {
        return res.status(403).json({
          success: false,
          message:
            "Only HOD can reject applications",
        });
      }

      if (!user.departmentId) {
        return res.status(400).json({
          success: false,
          message:
            "No department assigned to this HOD",
        });
      }

      // ==============================================
      // FIND MEMBERSHIP
      // ==============================================

      const membership =
        await ClubMembership.findById(
          membershipId
        ).populate("studentId");

      if (!membership) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found",
        });
      }

      // ==============================================
      // CHECK DEPARTMENT
      // ==============================================

      if (
        membership.studentId.departmentId.toString() !==
        user.departmentId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot reject applications from another department",
        });
      }

      // ==============================================
      // CHECK STATUS
      // ==============================================

      if (
        membership.status !==
        "PENDING_HOD_APPROVAL"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This application is not waiting for HOD approval",
        });
      }

      // ==============================================
      // REJECT
      // ==============================================

      membership.status =
        "REJECTED_BY_HOD";

      membership.hodApprovedBy =
        user._id;

      membership.hodApprovedAt =
        new Date();

      membership.hodRejectionReason =
        reason?.trim() ||
        "Application rejected by HOD";

      await membership.save();

      return res.status(200).json({
        success: true,

        message:
          "Student application rejected",

        membership,
      });

    } catch (error) {

      console.error(
        "Reject HOD application error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to reject student application",
      });
    }
  };