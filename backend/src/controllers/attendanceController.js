import Attendance from "../models/Attendance.js";
import ClubMembership from "../models/ClubMembership.js";
import StudentProfile from "../models/StudentProfile.js";

import Certificate from "../models/Certificate.js";

// ========================================================
// GET DETAILED CLUB ATTENDANCE
// HOD / ADMIN / PRINCIPAL / CLUB INCHARGE
// ========================================================

export const getClubAttendanceDetails = async (req, res) => {
  try {
    // ========================================================
    // ALLOWED ROLES
    // ========================================================

    const allowedRoles = [
      "CLUB_INCHARGE",
      "HOD",
      "ADMIN",
      "PRINCIPAL",
    ];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view attendance",
      });
    }

    // ========================================================
    // CLUB ID
    // ========================================================

    const { clubId } = req.query;

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: "Club is required",
      });
    }

    // ========================================================
    // HOD DEPARTMENT CHECK
    // ========================================================

    if (
      req.user.role === "HOD" &&
      !req.user.departmentId
    ) {
      return res.status(400).json({
        success: false,
        message: "Department is not assigned to this HOD",
      });
    }

    // ========================================================
    // GET CONFIRMED MEMBERS
    // ========================================================

    const memberships = await ClubMembership.find({
      clubId,
      status: "CONFIRMED",
    })
      .populate({
        path: "studentId",
        populate: [
          {
            path: "departmentId",
            select: "code name",
          },
          {
            path: "userId",
            select: "name email phone profilePhoto",
          },
        ],
      })
      .sort({
        createdAt: 1,
      });

    // ========================================================
    // HOD:
    // ONLY STUDENTS FROM HOD DEPARTMENT
    // ========================================================

    const filteredMemberships =
      req.user.role === "HOD"
        ? memberships.filter((membership) => {
            const student = membership.studentId;

            if (!student?.departmentId) {
              return false;
            }

            return (
              String(student.departmentId._id) ===
              String(req.user.departmentId)
            );
          })
        : memberships;

    // ========================================================
    // GET ALL ATTENDANCE RECORDS FOR THIS CLUB
    // ========================================================

    const attendanceRecords = await Attendance.find({
      clubId,
    }).sort({
      attendanceDate: 1,
    });

    // ========================================================
    // GET UNIQUE CLASS DATES
    // ========================================================

    const classDateSet = new Set();

    attendanceRecords.forEach((record) => {
      if (!record.attendanceDate) {
        return;
      }

      const date = new Date(record.attendanceDate)
        .toISOString()
        .split("T")[0];

      classDateSet.add(date);
    });

    const classDates = Array.from(
      classDateSet
    ).sort();

    const totalClasses = classDates.length;

    // ========================================================
    // GROUP ATTENDANCE BY STUDENT
    // ========================================================

    const attendanceMap = new Map();

    attendanceRecords.forEach((record) => {
      if (
        !record.studentId ||
        !record.attendanceDate
      ) {
        return;
      }

      const studentId =
        record.studentId.toString();

      if (!attendanceMap.has(studentId)) {
        attendanceMap.set(studentId, []);
      }

      const dateObject =
        new Date(record.attendanceDate);

      attendanceMap.get(studentId).push({
        date: dateObject
          .toISOString()
          .split("T")[0],

        day: dateObject.toLocaleDateString(
          "en-IN",
          {
            weekday: "long",
            timeZone: "UTC",
          }
        ),

        status: record.status,

        markedAt:
          record.markedAt || null,

        submittedAt:
          record.submittedAt || null,
      });
    });

    // ========================================================
    // BUILD STUDENT DATA
    // ========================================================

    const students = [];

    for (const membership of filteredMemberships) {
      const student =
        membership.studentId;

      if (!student) {
        continue;
      }

      const studentId =
        student._id.toString();

      const history =
        attendanceMap.get(studentId) || [];

      const attendedClasses =
        history.filter(
          (record) =>
            record.status === "PRESENT"
        ).length;

      const studentTotalClasses =
        history.length;

      const percentage =
        studentTotalClasses > 0
          ? Number(
              (
                (attendedClasses /
                  studentTotalClasses) *
                100
              ).toFixed(2)
            )
          : 0;

      // ======================================================
      // CERTIFICATE
      // ======================================================

      const certificate =
        await Certificate.findOne({
          studentId: student._id,
          clubId,
        }).select(
          "_id certificateNumber status approvedAt issuedAt"
        );

      const certificateStatus =
        certificate?.status || null;

      const certificateAllowed =
        certificateStatus === "APPROVED" ||
        certificateStatus === "ISSUED";

      students.push({
        studentId: student._id,

        name:
          student.userId?.name || "",

        email:
          student.userId?.email || "",

        phone:
          student.userId?.phone || "",

        registerNumber:
          student.registerNumber || "",

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

        semester:
          student.semester,

        admissionYear:
          student.admissionYear,

        photoUrl:
          student.photoUrl ||
          student.userId?.profilePhoto ||
          null,

        attendedClasses,

        totalClasses:
          studentTotalClasses,

        percentage,

        attendanceHistory:
          history,

        certificateId:
          certificate?._id || null,

        certificateNumber:
          certificate?.certificateNumber ||
          null,

        certificateStatus,

        certificateAllowed,

        approvedAt:
          certificate?.approvedAt || null,

        issuedAt:
          certificate?.issuedAt || null,
      });
    }

    // ========================================================
    // SORT
    // ========================================================

    students.sort((a, b) =>
      String(
        a.registerNumber || ""
      ).localeCompare(
        String(
          b.registerNumber || ""
        )
      )
    );

    // ========================================================
    // SUMMARY
    // ========================================================

    const certificateAllowedCount =
      students.filter(
        (student) =>
          student.certificateAllowed
      ).length;

    const attendance75Plus =
      students.filter(
        (student) =>
          student.percentage >= 75
      ).length;

    const averageAttendance =
      students.length > 0
        ? Number(
            (
              students.reduce(
                (sum, student) =>
                  sum +
                  Number(
                    student.percentage || 0
                  ),
                0
              ) / students.length
            ).toFixed(2)
          )
        : 0;

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      clubId,

      totalClasses,

      classDates,

      count: students.length,

      summary: {
        totalStudents:
          students.length,

        averageAttendance,

        attendance75Plus,

        certificateAllowed:
          certificateAllowedCount,
      },

      students,
    });

  } catch (error) {
    console.error(
      "Get club attendance details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load detailed attendance",
    });
  }
};

/* =========================================================
   GET STUDENT DETAILED ATTENDANCE
   Student can view ONLY their own attendance
   ========================================================= */

export const getStudentAttendance = async (req, res) => {
  try {
    // -----------------------------------------------------
    // CHECK LOGGED-IN USER
    // -----------------------------------------------------

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // -----------------------------------------------------
    // FIND STUDENT PROFILE
    // -----------------------------------------------------

    const student = await StudentProfile.findOne({
      userId: req.userId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // -----------------------------------------------------
    // GET ALL ATTENDANCE RECORDS FOR THIS STUDENT
    // -----------------------------------------------------

    const records = await Attendance.find({
      studentId: student._id,
    })
      .populate({
        path: "clubId",
        select: "name code",
      })
      .sort({
        attendanceDate: 1,
      });

    // -----------------------------------------------------
    // GROUP ATTENDANCE CLUB-WISE
    // -----------------------------------------------------

    const clubMap = new Map();

    records.forEach((record) => {
      if (!record.clubId || !record.attendanceDate) {
        return;
      }

      const clubId = record.clubId._id.toString();

      // Create club entry
      if (!clubMap.has(clubId)) {
        clubMap.set(clubId, {
          clubId: record.clubId._id,
          clubName: record.clubId.name,
          clubCode: record.clubId.code,

          attendedClasses: 0,
          totalClasses: 0,
          absentClasses: 0,

          percentage: 0,

          attendanceHistory: [],
        });
      }

      const club = clubMap.get(clubId);

      // ---------------------------------------------------
      // DATE
      // ---------------------------------------------------

      const dateObject = new Date(record.attendanceDate);

      const date = dateObject
        .toISOString()
        .split("T")[0];

      const day = dateObject.toLocaleDateString(
        "en-IN",
        {
          weekday: "long",
          timeZone: "UTC",
        }
      );

      // ---------------------------------------------------
      // ATTENDANCE COUNT
      // ---------------------------------------------------

      club.totalClasses += 1;

      if (record.status === "PRESENT") {
        club.attendedClasses += 1;
      }

      if (record.status === "ABSENT") {
        club.absentClasses += 1;
      }

      // ---------------------------------------------------
      // DATE-WISE ATTENDANCE
      // ---------------------------------------------------

      club.attendanceHistory.push({
        date,
        day,
        status: record.status,
        markedAt: record.markedAt || null,
        submittedAt: record.submittedAt || null,
      });
    });

    // -----------------------------------------------------
    // CALCULATE PERCENTAGE
    // -----------------------------------------------------

    const attendance = Array.from(
      clubMap.values()
    ).map((club) => {
      club.percentage =
        club.totalClasses > 0
          ? Number(
              (
                (club.attendedClasses /
                  club.totalClasses) *
                100
              ).toFixed(2)
            )
          : 0;

      // Make sure history is sorted by date
      club.attendanceHistory.sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );

      return club;
    });

    // -----------------------------------------------------
    // OVERALL ATTENDANCE
    // -----------------------------------------------------

    const totalClasses = attendance.reduce(
      (sum, club) =>
        sum + Number(club.totalClasses || 0),
      0
    );

    const attendedClasses = attendance.reduce(
      (sum, club) =>
        sum + Number(club.attendedClasses || 0),
      0
    );

    const absentClasses = attendance.reduce(
      (sum, club) =>
        sum + Number(club.absentClasses || 0),
      0
    );

    const overallPercentage =
      totalClasses > 0
        ? Number(
            (
              (attendedClasses /
                totalClasses) *
              100
            ).toFixed(2)
          )
        : 0;

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(200).json({
      success: true,

      attendance,

      overall: {
        attendedClasses,
        absentClasses,
        totalClasses,
        percentage: overallPercentage,
      },
    });
  } catch (error) {
    console.error(
      "Get student detailed attendance error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load student attendance",
    });
  }
};

/* =========================================================
   GET CONSOLIDATED CLUB ATTENDANCE
   ========================================================= */

export const getConsolidatedAttendance = async (req, res) => {
  try {
    const allowedRoles = [
      "CLUB_INCHARGE",
      "HOD",
      "ADMIN",
      "PRINCIPAL",
    ];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view attendance",
      });
    }

    const { clubId } = req.query;

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: "Club is required",
      });
    }

    /* -----------------------------------------------------
       HOD SECURITY
       ----------------------------------------------------- */

    let departmentFilter = {};

    if (req.user.role === "HOD") {
      if (!req.user.departmentId) {
        return res.status(400).json({
          success: false,
          message: "Department is not assigned to this HOD",
        });
      }

      departmentFilter = {
        "student.departmentId": req.user.departmentId,
      };
    }

    /* -----------------------------------------------------
       Get all attendance records
       ----------------------------------------------------- */

    const records = await Attendance.find({
      clubId,
    })
      .populate({
        path: "studentId",
        populate: [
          {
            path: "departmentId",
            select: "code name",
          },
          {
            path: "userId",
            select: "name email phone profilePhoto",
          },
        ],
      })
      .sort({
        attendanceDate: 1,
      });

    /* -----------------------------------------------------
       Remove invalid / department restricted records
       ----------------------------------------------------- */

    const filteredRecords = records.filter((record) => {
      if (!record.studentId) {
        return false;
      }

      if (req.user.role === "HOD") {
        return (
          record.studentId.departmentId &&
          record.studentId.departmentId._id.toString() ===
            req.user.departmentId.toString()
        );
      }

      return true;
    });

    /* -----------------------------------------------------
       Find all submitted class dates
       ----------------------------------------------------- */

    const classDates = [
      ...new Set(
        filteredRecords.map((record) =>
          new Date(record.attendanceDate)
            .toISOString()
            .split("T")[0]
        )
      ),
    ];

    const totalClasses = classDates.length;

    /* -----------------------------------------------------
       Consolidate student attendance
       ----------------------------------------------------- */

    const studentMap = new Map();

    filteredRecords.forEach((record) => {
      const student = record.studentId;
      const studentId = student._id.toString();

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId: student._id,

          name: student.userId?.name || "",
          email: student.userId?.email || "",

          registerNumber: student.registerNumber,

          department: student.departmentId
            ? {
                _id: student.departmentId._id,
                code: student.departmentId.code,
                name: student.departmentId.name,
              }
            : null,

          semester: student.semester,
          admissionYear: student.admissionYear,

          photoUrl:
            student.photoUrl ||
            student.userId?.profilePhoto ||
            null,

          attendedClasses: 0,
          totalClasses,
          percentage: 0,
        });
      }

      if (record.status === "PRESENT") {
        const current = studentMap.get(studentId);

        current.attendedClasses += 1;
      }
    });

    /* -----------------------------------------------------
       Calculate percentage
       ----------------------------------------------------- */

    const students = Array.from(studentMap.values()).map(
      (student) => ({
        ...student,

        percentage:
          student.totalClasses > 0
            ? Math.round(
                (student.attendedClasses /
                  student.totalClasses) *
                  100
              )
            : 0,
      })
    );

    return res.status(200).json({
      success: true,
      clubId,
      totalClasses,
      classDates,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error(
      "Get consolidated attendance error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load consolidated attendance",
    });
  }
};

/* =========================================================
   GET CLUB MEMBERS FOR ATTENDANCE
   ========================================================= */

export const getClubAttendanceMembers = async (req, res) => {
  try {
    // Only Club In-charge can mark attendance
    if (req.user.role !== "CLUB_INCHARGE") {
      return res.status(403).json({
        success: false,
        message: "Only Club In-charge can manage attendance",
      });
    }

    const { attendanceDate } = req.query;

    if (!attendanceDate) {
      return res.status(400).json({
        success: false,
        message: "Attendance date is required",
      });
    }

    if (!req.user.clubId) {
      return res.status(400).json({
        success: false,
        message: "Club is not assigned to this user",
      });
    }

    // Create date range for the selected day
    const startDate = new Date(`${attendanceDate}T00:00:00.000Z`);
    const endDate = new Date(`${attendanceDate}T23:59:59.999Z`);

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date",
      });
    }

    // Get confirmed members of this club
    const memberships = await ClubMembership.find({
      clubId: req.user.clubId,
      status: "CONFIRMED",
    }).populate({
      path: "studentId",
      populate: [
        {
          path: "departmentId",
          select: "code name",
        },
        {
          path: "userId",
          select: "name email phone profilePhoto",
        },
      ],
    });

    // Get already submitted attendance for this date
    const existingAttendance = await Attendance.find({
      clubId: req.user.clubId,
      attendanceDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const attendanceMap = new Map();

    existingAttendance.forEach((record) => {
      attendanceMap.set(
        record.studentId.toString(),
        record.status
      );
    });

    const submitted = existingAttendance.length > 0;

    const students = memberships
      .filter((membership) => membership.studentId)
      .map((membership) => {
        const student = membership.studentId;
        const user = student.userId;

        return {
          studentId: student._id,
          membershipId: membership._id,

          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone || "",

          registerNumber: student.registerNumber,

          department: student.departmentId
            ? {
                _id: student.departmentId._id,
                code: student.departmentId.code,
                name: student.departmentId.name,
              }
            : null,

          semester: student.semester,
          admissionYear: student.admissionYear,
          photoUrl: student.photoUrl || user?.profilePhoto || null,

          status:
            attendanceMap.get(student._id.toString()) || null,
        };
      });

    return res.status(200).json({
      success: true,
      attendanceDate,
      submitted,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Get club attendance members error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load attendance members",
    });
  }
};


/* =========================================================
   SUBMIT CLUB ATTENDANCE
   ========================================================= */

export const submitClubAttendance = async (req, res) => {
  try {
    // Only Club In-charge can submit attendance
    if (req.user.role !== "CLUB_INCHARGE") {
      return res.status(403).json({
        success: false,
        message: "Only Club In-charge can submit attendance",
      });
    }

    if (!req.user.clubId) {
      return res.status(400).json({
        success: false,
        message: "Club is not assigned to this user",
      });
    }

    const { attendanceDate, attendance } = req.body;

    if (!attendanceDate) {
      return res.status(400).json({
        success: false,
        message: "Attendance date is required",
      });
    }

    if (!Array.isArray(attendance) || attendance.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Attendance data is required",
      });
    }

    const startDate = new Date(`${attendanceDate}T00:00:00.000Z`);
    const endDate = new Date(`${attendanceDate}T23:59:59.999Z`);

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date",
      });
    }

    /* -----------------------------------------------------
       Get all confirmed members of this club
       ----------------------------------------------------- */

    const memberships = await ClubMembership.find({
      clubId: req.user.clubId,
      status: "CONFIRMED",
    }).select("studentId");

    const confirmedStudentIds = new Set(
      memberships.map((membership) =>
        membership.studentId.toString()
      )
    );

    /* -----------------------------------------------------
       Check that every submitted student belongs to club
       ----------------------------------------------------- */

    for (const item of attendance) {
      if (!item.studentId || !item.status) {
        return res.status(400).json({
          success: false,
          message: "Invalid attendance data",
        });
      }

      if (!["PRESENT", "ABSENT"].includes(item.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid attendance status for student ${item.studentId}`,
        });
      }

      if (!confirmedStudentIds.has(item.studentId.toString())) {
        return res.status(403).json({
          success: false,
          message: "Invalid student in attendance list",
        });
      }
    }

    /* -----------------------------------------------------
       Make sure every confirmed member is included
       ----------------------------------------------------- */

    if (attendance.length !== confirmedStudentIds.size) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance must be marked for all confirmed club members",
      });
    }

    const submittedStudentIds = new Set(
      attendance.map((item) => item.studentId.toString())
    );

    for (const studentId of confirmedStudentIds) {
      if (!submittedStudentIds.has(studentId)) {
        return res.status(400).json({
          success: false,
          message:
            "Attendance must be marked for every confirmed club member",
        });
      }
    }

    /* -----------------------------------------------------
       Check whether attendance was already submitted
       ----------------------------------------------------- */

    const existingAttendance = await Attendance.findOne({
      clubId: req.user.clubId,
      attendanceDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message:
          "Attendance for this date has already been submitted and is locked",
      });
    }

    /* -----------------------------------------------------
       Create attendance records
       ----------------------------------------------------- */

    const records = attendance.map((item) => ({
      clubId: req.user.clubId,
      attendanceDate: startDate,
      studentId: item.studentId,
      status: item.status,
      markedBy: req.userId,
      markedAt: new Date(),
      submittedAt: new Date(),
    }));

    await Attendance.insertMany(records);

    return res.status(201).json({
      success: true,
      message: "Attendance submitted successfully",
      attendanceDate,
      count: records.length,
    });
  } catch (error) {
    console.error("Submit club attendance error:", error);

    // Handles duplicate submission caused by the unique index
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Attendance for this date has already been submitted and is locked",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to submit attendance",
    });
  }
};

/* =========================================================
   VIEW ATTENDANCE
   HOD / ADMIN / PRINCIPAL
   ========================================================= */

export const viewAttendance = async (req, res) => {
  try {
    // Only HOD, ADMIN and PRINCIPAL can view attendance
    const allowedRoles = ["HOD", "ADMIN", "PRINCIPAL"];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view attendance",
      });
    }

    const { clubId, attendanceDate } = req.query;

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: "Club is required",
      });
    }

    if (!attendanceDate) {
      return res.status(400).json({
        success: false,
        message: "Attendance date is required",
      });
    }

    const startDate = new Date(
      `${attendanceDate}T00:00:00.000Z`
    );

    const endDate = new Date(
      `${attendanceDate}T23:59:59.999Z`
    );

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date",
      });
    }

    /* -----------------------------------------------------
       Get attendance records
       ----------------------------------------------------- */

    const attendanceRecords = await Attendance.find({
      clubId,
      attendanceDate: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate({
        path: "studentId",
        populate: [
          {
            path: "departmentId",
            select: "code name",
          },
          {
            path: "userId",
            select: "name email phone profilePhoto",
          },
        ],
      })
      .populate({
        path: "markedBy",
        select: "name email role",
      })
      .sort({ "studentId.registerNumber": 1 });

    if (attendanceRecords.length === 0) {
      return res.status(200).json({
        success: true,
        attendanceDate,
        submitted: false,
        count: 0,
        students: [],
      });
    }

    const students = attendanceRecords
      .filter((record) => record.studentId)
      .map((record) => {
        const student = record.studentId;
        const user = student.userId;

        return {
          studentId: student._id,

          name: user?.name || "",
          email: user?.email || "",

          registerNumber: student.registerNumber,

          department: student.departmentId
            ? {
                _id: student.departmentId._id,
                code: student.departmentId.code,
                name: student.departmentId.name,
              }
            : null,

          semester: student.semester,
          admissionYear: student.admissionYear,

          photoUrl:
            student.photoUrl ||
            user?.profilePhoto ||
            null,

          status: record.status,

          markedAt: record.markedAt,
          submittedAt: record.submittedAt,

          markedBy: record.markedBy
            ? {
                id: record.markedBy._id,
                name: record.markedBy.name,
                email: record.markedBy.email,
                role: record.markedBy.role,
              }
            : null,
        };
      });

    return res.status(200).json({
      success: true,
      attendanceDate,
      submitted: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("View attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load attendance",
    });
  }
};