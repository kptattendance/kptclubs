import Attendance from "../models/Attendance.js";
import ClubMembership from "../models/ClubMembership.js";
import StudentProfile from "../models/StudentProfile.js";


/* =========================================================
   GET STUDENT CONSOLIDATED ATTENDANCE
   ========================================================= */

export const getStudentAttendance = async (req, res) => {
  try {
    // req.userId is MongoDB User _id
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Find the StudentProfile belonging to this user
    const student = await StudentProfile.findOne({
      userId: req.userId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    /* -----------------------------------------------------
       Get all attendance records for this student
       ----------------------------------------------------- */

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

    /* -----------------------------------------------------
       Group attendance club-wise
       ----------------------------------------------------- */

    const clubMap = new Map();

    records.forEach((record) => {
      if (!record.clubId) {
        return;
      }

      const clubId = record.clubId._id.toString();

      if (!clubMap.has(clubId)) {
        clubMap.set(clubId, {
          clubId: record.clubId._id,
          clubName: record.clubId.name,
          clubCode: record.clubId.code,

          attendedClasses: 0,
          totalClasses: 0,
        });
      }

      const club = clubMap.get(clubId);

      club.totalClasses += 1;

      if (record.status === "PRESENT") {
        club.attendedClasses += 1;
      }
    });

    /* -----------------------------------------------------
       Calculate percentage
       ----------------------------------------------------- */

    const attendance = Array.from(clubMap.values()).map(
      (club) => ({
        ...club,

        percentage:
          club.totalClasses > 0
            ? Math.round(
                (club.attendedClasses /
                  club.totalClasses) *
                  100
              )
            : 0,
      })
    );

    /* -----------------------------------------------------
       Overall attendance
       ----------------------------------------------------- */

    const totalClasses = attendance.reduce(
      (sum, club) => sum + club.totalClasses,
      0
    );

    const attendedClasses = attendance.reduce(
      (sum, club) => sum + club.attendedClasses,
      0
    );

    const overallPercentage =
      totalClasses > 0
        ? Math.round(
            (attendedClasses / totalClasses) * 100
          )
        : 0;

    return res.status(200).json({
      success: true,

      attendance,

      overall: {
        attendedClasses,
        totalClasses,
        percentage: overallPercentage,
      },
    });
  } catch (error) {
    console.error(
      "Get student attendance error:",
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