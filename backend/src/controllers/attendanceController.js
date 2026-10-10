import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import ClubMembership from "../models/ClubMembership.js";
import StudentProfile from "../models/StudentProfile.js";
import Club from "../models/Club.js";
import Certificate from "../models/Certificate.js";

// =========================================================
// HELPERS
// =========================================================

const isValidId = (value) =>
  typeof value === "string" &&
  mongoose.Types.ObjectId.isValid(value);

// "2026-01-31" -> start and end of that day (UTC)
const getDayRange = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const startDate = new Date(`${value}T00:00:00.000Z`);
  const endDate = new Date(`${value}T23:59:59.999Z`);

  if (isNaN(startDate.getTime())) {
    return null;
  }

  return { startDate, endDate };
};

const toDateKey = (value) =>
  new Date(value).toISOString().split("T")[0];

// Formatting a weekday is slow, so do it once per date
const createDayNameLookup = () => {
  const dayNames = new Map();

  return (dateKey) => {
    if (!dayNames.has(dateKey)) {
      dayNames.set(
        dateKey,
        new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString(
          "en-IN",
          {
            weekday: "long",
            timeZone: "UTC",
          }
        )
      );
    }

    return dayNames.get(dateKey);
  };
};

const toPercentage = (attended, total) =>
  total > 0
    ? Number(((attended / total) * 100).toFixed(2))
    : 0;

const STUDENT_POPULATE = [
  {
    path: "departmentId",
    select: "code name",
  },
  {
    path: "userId",
    select: "name email phone profilePhoto",
  },
];

const STUDENT_FIELDS =
  "registerNumber semester admissionYear photoUrl departmentId userId";

const formatDepartment = (department) =>
  department
    ? {
        _id: department._id,
        code: department.code,
        name: department.name,
      }
    : null;

const byRegisterNumber = (a, b) =>
  String(a.registerNumber || "").localeCompare(
    String(b.registerNumber || "")
  );

// A Club In-charge may only read attendance of their own club
const canAccessClub = (user, clubId) =>
  user.role !== "CLUB_INCHARGE" ||
  String(user.clubId || "") === String(clubId);

// =========================================================
// ADMIN - ATTENDANCE SUBMISSION STATUS
// ONLY CLUBS HAVING AT LEAST ONE CONFIRMED STUDENT
// =========================================================

export const getAdminAttendanceStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view attendance status",
      });
    }

    const { date } = req.query;

    let dayRange = null;

    if (date) {
      dayRange = getDayRange(date);

      if (!dayRange) {
        return res.status(400).json({
          success: false,
          message: "Invalid attendance date",
        });
      }
    }

    // -----------------------------------------------------
    // FIND CLUBS WHICH ACTUALLY HAVE CONFIRMED STUDENTS
    // -----------------------------------------------------

    const clubMemberCounts = await ClubMembership.aggregate([
      {
        $match: {
          status: "CONFIRMED",
        },
      },
      {
        $group: {
          _id: "$clubId",
          totalMembers: {
            $sum: 1,
          },
        },
      },
    ]);

    if (clubMemberCounts.length === 0) {
      return res.status(200).json({
        success: true,
        filterDate: date || null,
        summary: {
          totalClubs: 0,
          markedClubs: 0,
          notMarkedClubs: 0,
          totalSessions: 0,
        },
        clubs: [],
      });
    }

    const memberCountMap = new Map(
      clubMemberCounts.map((item) => [
        String(item._id),
        Number(item.totalMembers || 0),
      ])
    );

    const clubIds = clubMemberCounts.map((item) => item._id);

    // -----------------------------------------------------
    // CLUBS + ONE ROW PER CLUB PER ATTENDANCE DATE
    // (grouped in the database instead of loading every record)
    // -----------------------------------------------------

    const attendanceMatch = {
      clubId: {
        $in: clubIds,
      },
    };

    if (dayRange) {
      attendanceMatch.attendanceDate = {
        $gte: dayRange.startDate,
        $lte: dayRange.endDate,
      };
    }

    const [clubs, sessions] = await Promise.all([
      Club.find({
        _id: {
          $in: clubIds,
        },
        isActive: true,
      })
        .select("_id code name")
        .sort({ name: 1 })
        .lean(),

      Attendance.aggregate([
        {
          $match: attendanceMatch,
        },
        {
          $group: {
            _id: {
              clubId: "$clubId",
              attendanceDate: "$attendanceDate",
            },
          },
        },
      ]),
    ]);

    const attendanceMap = new Map();

    sessions.forEach((session) => {
      const clubId = String(session._id.clubId);

      if (!attendanceMap.has(clubId)) {
        attendanceMap.set(clubId, new Set());
      }

      attendanceMap
        .get(clubId)
        .add(toDateKey(session._id.attendanceDate));
    });

    // -----------------------------------------------------
    // BUILD RESULT
    // -----------------------------------------------------

    const result = clubs.map((club) => {
      const clubId = String(club._id);

      const attendanceDates = Array.from(
        attendanceMap.get(clubId) || []
      ).sort();

      return {
        clubId: club._id,
        code: club.code || "",
        name: club.name || "Unnamed Club",

        // Number of CONFIRMED students
        totalMembers: memberCountMap.get(clubId) || 0,

        attendanceDates,

        totalSessions: attendanceDates.length,

        lastMarkedDate:
          attendanceDates.length > 0
            ? attendanceDates[attendanceDates.length - 1]
            : null,

        marked: attendanceDates.length > 0,
      };
    });

    const markedClubs = result.filter(
      (club) => club.marked
    ).length;

    const totalSessions = result.reduce(
      (total, club) => total + club.totalSessions,
      0
    );

    return res.status(200).json({
      success: true,

      filterDate: date || null,

      summary: {
        totalClubs: result.length,
        markedClubs,
        notMarkedClubs: result.length - markedClubs,
        totalSessions,
      },

      clubs: result,
    });
  } catch (error) {
    console.error(
      "Get admin attendance status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load attendance status",
    });
  }
};

// ========================================================
// GET DETAILED CLUB ATTENDANCE
// HOD / ADMIN / PRINCIPAL / CLUB INCHARGE
// ========================================================

export const getClubAttendanceDetails = async (req, res) => {
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

    if (!isValidId(clubId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club",
      });
    }

    if (!canAccessClub(req.user, clubId)) {
      return res.status(403).json({
        success: false,
        message: "You can view attendance only for your own club",
      });
    }

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
    // MEMBERS, ATTENDANCE AND CERTIFICATES
    // Three queries in parallel, no query per student.
    // ========================================================

    const [memberships, attendanceRecords, certificates] =
      await Promise.all([
        ClubMembership.find({
          clubId,
          status: "CONFIRMED",
        })
          .select("studentId")
          .populate({
            path: "studentId",
            select: STUDENT_FIELDS,
            populate: STUDENT_POPULATE,
          })
          .lean(),

        Attendance.find({
          clubId,
        })
          .select(
            "studentId attendanceDate status markedAt submittedAt"
          )
          .sort({
            attendanceDate: 1,
          })
          .lean(),

        Certificate.find({
          clubId,
        })
          .select(
            "studentId certificateNumber status approvedAt issuedAt"
          )
          .lean(),
      ]);

    // ========================================================
    // HOD: ONLY STUDENTS FROM HOD DEPARTMENT
    // ========================================================

    const filteredMemberships =
      req.user.role === "HOD"
        ? memberships.filter(
            (membership) =>
              membership.studentId?.departmentId &&
              String(membership.studentId.departmentId._id) ===
                String(req.user.departmentId)
          )
        : memberships;

    // ========================================================
    // GROUP ATTENDANCE BY STUDENT + UNIQUE CLASS DATES
    // ========================================================

    const getDayName = createDayNameLookup();

    const classDateSet = new Set();

    const attendanceMap = new Map();

    attendanceRecords.forEach((record) => {
      if (!record.studentId || !record.attendanceDate) {
        return;
      }

      const date = toDateKey(record.attendanceDate);

      classDateSet.add(date);

      const studentId = String(record.studentId);

      if (!attendanceMap.has(studentId)) {
        attendanceMap.set(studentId, []);
      }

      attendanceMap.get(studentId).push({
        date,
        day: getDayName(date),
        status: record.status,
        markedAt: record.markedAt || null,
        submittedAt: record.submittedAt || null,
      });
    });

    const classDates = Array.from(classDateSet).sort();

    const certificateMap = new Map(
      certificates.map((certificate) => [
        String(certificate.studentId),
        certificate,
      ])
    );

    // ========================================================
    // BUILD STUDENT DATA
    // ========================================================

    const students = [];

    for (const membership of filteredMemberships) {
      const student = membership.studentId;

      if (!student) {
        continue;
      }

      const studentId = String(student._id);

      const history = attendanceMap.get(studentId) || [];

      const attendedClasses = history.filter(
        (record) => record.status === "PRESENT"
      ).length;

      const certificate = certificateMap.get(studentId);

      const certificateStatus = certificate?.status || null;

      students.push({
        studentId: student._id,

        name: student.userId?.name || "",

        email: student.userId?.email || "",

        phone: student.userId?.phone || "",

        registerNumber: student.registerNumber || "",

        department: formatDepartment(student.departmentId),

        semester: student.semester,

        admissionYear: student.admissionYear,

        photoUrl:
          student.photoUrl ||
          student.userId?.profilePhoto ||
          null,

        attendedClasses,

        totalClasses: history.length,

        percentage: toPercentage(
          attendedClasses,
          history.length
        ),

        attendanceHistory: history,

        certificateId: certificate?._id || null,

        certificateNumber:
          certificate?.certificateNumber || null,

        certificateStatus,

        certificateAllowed:
          certificateStatus === "APPROVED" ||
          certificateStatus === "ISSUED",

        approvedAt: certificate?.approvedAt || null,

        issuedAt: certificate?.issuedAt || null,
      });
    }

    students.sort(byRegisterNumber);

    // ========================================================
    // SUMMARY
    // ========================================================

    const averageAttendance =
      students.length > 0
        ? Number(
            (
              students.reduce(
                (sum, student) => sum + student.percentage,
                0
              ) / students.length
            ).toFixed(2)
          )
        : 0;

    return res.status(200).json({
      success: true,

      clubId,

      totalClasses: classDates.length,

      classDates,

      count: students.length,

      summary: {
        totalStudents: students.length,

        averageAttendance,

        attendance75Plus: students.filter(
          (student) => student.percentage >= 75
        ).length,

        certificateAllowed: students.filter(
          (student) => student.certificateAllowed
        ).length,
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
      message: "Failed to load detailed attendance",
    });
  }
};

/* =========================================================
   GET STUDENT DETAILED ATTENDANCE
   Student can view ONLY their own attendance
   ========================================================= */

export const getStudentAttendance = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const student = await StudentProfile.findOne({
      userId: req.userId,
    })
      .select("_id")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const records = await Attendance.find({
      studentId: student._id,
    })
      .select("clubId attendanceDate status markedAt submittedAt")
      .populate({
        path: "clubId",
        select: "name code",
      })
      .sort({
        attendanceDate: 1,
      })
      .lean();

    // -----------------------------------------------------
    // GROUP ATTENDANCE CLUB-WISE
    // -----------------------------------------------------

    const getDayName = createDayNameLookup();

    const clubMap = new Map();

    records.forEach((record) => {
      if (!record.clubId || !record.attendanceDate) {
        return;
      }

      const clubId = String(record.clubId._id);

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

      const date = toDateKey(record.attendanceDate);

      club.totalClasses += 1;

      if (record.status === "PRESENT") {
        club.attendedClasses += 1;
      }

      if (record.status === "ABSENT") {
        club.absentClasses += 1;
      }

      // Records are already sorted by date
      club.attendanceHistory.push({
        date,
        day: getDayName(date),
        status: record.status,
        markedAt: record.markedAt || null,
        submittedAt: record.submittedAt || null,
      });
    });

    const attendance = Array.from(clubMap.values()).map(
      (club) => {
        club.percentage = toPercentage(
          club.attendedClasses,
          club.totalClasses
        );

        return club;
      }
    );

    // -----------------------------------------------------
    // OVERALL ATTENDANCE
    // -----------------------------------------------------

    const totalClasses = attendance.reduce(
      (sum, club) => sum + club.totalClasses,
      0
    );

    const attendedClasses = attendance.reduce(
      (sum, club) => sum + club.attendedClasses,
      0
    );

    const absentClasses = attendance.reduce(
      (sum, club) => sum + club.absentClasses,
      0
    );

    return res.status(200).json({
      success: true,

      attendance,

      overall: {
        attendedClasses,
        absentClasses,
        totalClasses,
        percentage: toPercentage(
          attendedClasses,
          totalClasses
        ),
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

    if (!isValidId(clubId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club",
      });
    }

    if (!canAccessClub(req.user, clubId)) {
      return res.status(403).json({
        success: false,
        message: "You can view attendance only for your own club",
      });
    }

    if (
      req.user.role === "HOD" &&
      !req.user.departmentId
    ) {
      return res.status(400).json({
        success: false,
        message: "Department is not assigned to this HOD",
      });
    }

    /* -----------------------------------------------------
       Attendance records (small fields only)
       ----------------------------------------------------- */

    const records = await Attendance.find({
      clubId,
    })
      .select("studentId attendanceDate status")
      .sort({
        attendanceDate: 1,
      })
      .lean();

    /* -----------------------------------------------------
       Load each student once instead of once per record
       ----------------------------------------------------- */

    const studentIds = [
      ...new Set(
        records
          .filter((record) => record.studentId)
          .map((record) => String(record.studentId))
      ),
    ];

    const studentQuery = {
      _id: {
        $in: studentIds,
      },
    };

    // HOD SECURITY: only students of the HOD's department
    if (req.user.role === "HOD") {
      studentQuery.departmentId = req.user.departmentId;
    }

    const studentProfiles =
      studentIds.length > 0
        ? await StudentProfile.find(studentQuery)
            .select(STUDENT_FIELDS)
            .populate(STUDENT_POPULATE)
            .lean()
        : [];

    const profileMap = new Map(
      studentProfiles.map((student) => [
        String(student._id),
        student,
      ])
    );

    /* -----------------------------------------------------
       Consolidate student attendance
       ----------------------------------------------------- */

    const classDateSet = new Set();

    const attendedMap = new Map();

    records.forEach((record) => {
      const studentId = String(record.studentId || "");

      // Deleted student, or outside the HOD's department
      if (!profileMap.has(studentId)) {
        return;
      }

      classDateSet.add(toDateKey(record.attendanceDate));

      attendedMap.set(
        studentId,
        (attendedMap.get(studentId) || 0) +
          (record.status === "PRESENT" ? 1 : 0)
      );
    });

    const classDates = Array.from(classDateSet).sort();

    const totalClasses = classDates.length;

    const students = Array.from(attendedMap.entries())
      .map(([studentId, attendedClasses]) => {
        const student = profileMap.get(studentId);

        return {
          studentId: student._id,

          name: student.userId?.name || "",
          email: student.userId?.email || "",

          registerNumber: student.registerNumber,

          department: formatDepartment(student.departmentId),

          semester: student.semester,
          admissionYear: student.admissionYear,

          photoUrl:
            student.photoUrl ||
            student.userId?.profilePhoto ||
            null,

          attendedClasses,
          totalClasses,

          percentage:
            totalClasses > 0
              ? Math.round(
                  (attendedClasses / totalClasses) * 100
                )
              : 0,
        };
      })
      .sort(byRegisterNumber);

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

    const dayRange = getDayRange(attendanceDate);

    if (!dayRange) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date",
      });
    }

    // Confirmed members + attendance already submitted for this date
    const [memberships, existingAttendance] = await Promise.all([
      ClubMembership.find({
        clubId: req.user.clubId,
        status: "CONFIRMED",
      })
        .select("studentId")
        .populate({
          path: "studentId",
          select: STUDENT_FIELDS,
          populate: STUDENT_POPULATE,
        })
        .lean(),

      Attendance.find({
        clubId: req.user.clubId,
        attendanceDate: {
          $gte: dayRange.startDate,
          $lte: dayRange.endDate,
        },
      })
        .select("studentId status")
        .lean(),
    ]);

    const attendanceMap = new Map(
      existingAttendance.map((record) => [
        String(record.studentId),
        record.status,
      ])
    );

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

          department: formatDepartment(student.departmentId),

          semester: student.semester,
          admissionYear: student.admissionYear,
          photoUrl: student.photoUrl || user?.profilePhoto || null,

          status:
            attendanceMap.get(String(student._id)) || null,
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

    const { attendanceDate, attendance } = req.body || {};

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

    const dayRange = getDayRange(attendanceDate);

    if (!dayRange) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date",
      });
    }

    // Submitted attendance is locked, so a future date would be
    // a permanent mistake. One day of slack covers time zones.
    if (
      dayRange.startDate.getTime() >
      Date.now() + 24 * 60 * 60 * 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Attendance cannot be marked for a future date",
      });
    }

    /* -----------------------------------------------------
       Confirmed members + existing attendance for this date
       ----------------------------------------------------- */

    const [memberships, existingAttendance] = await Promise.all([
      ClubMembership.find({
        clubId: req.user.clubId,
        status: "CONFIRMED",
      })
        .select("studentId")
        .lean(),

      Attendance.exists({
        clubId: req.user.clubId,
        attendanceDate: {
          $gte: dayRange.startDate,
          $lte: dayRange.endDate,
        },
      }),
    ]);

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message:
          "Attendance for this date has already been submitted and is locked",
      });
    }

    const confirmedStudentIds = new Set(
      memberships.map((membership) =>
        String(membership.studentId)
      )
    );

    /* -----------------------------------------------------
       Check that every submitted student belongs to club
       ----------------------------------------------------- */

    const submittedStudentIds = new Set();

    for (const item of attendance) {
      if (
        !item ||
        !isValidId(item.studentId) ||
        typeof item.status !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid attendance data",
        });
      }

      if (!["PRESENT", "ABSENT"].includes(item.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid attendance status",
        });
      }

      if (!confirmedStudentIds.has(item.studentId)) {
        return res.status(403).json({
          success: false,
          message: "Invalid student in attendance list",
        });
      }

      submittedStudentIds.add(item.studentId);
    }

    /* -----------------------------------------------------
       Make sure every confirmed member is included once
       ----------------------------------------------------- */

    if (
      attendance.length !== confirmedStudentIds.size ||
      submittedStudentIds.size !== confirmedStudentIds.size
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance must be marked for all confirmed club members",
      });
    }

    /* -----------------------------------------------------
       Create attendance records
       ----------------------------------------------------- */

    const now = new Date();

    const records = attendance.map((item) => ({
      clubId: req.user.clubId,
      attendanceDate: dayRange.startDate,
      studentId: item.studentId,
      status: item.status,
      markedBy: req.userId,
      markedAt: now,
      submittedAt: now,
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

    if (!isValidId(clubId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club",
      });
    }

    if (!attendanceDate) {
      return res.status(400).json({
        success: false,
        message: "Attendance date is required",
      });
    }

    const dayRange = getDayRange(attendanceDate);

    if (!dayRange) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date",
      });
    }

    if (
      req.user.role === "HOD" &&
      !req.user.departmentId
    ) {
      return res.status(400).json({
        success: false,
        message: "Department is not assigned to this HOD",
      });
    }

    /* -----------------------------------------------------
       Get attendance records
       ----------------------------------------------------- */

    const attendanceRecords = await Attendance.find({
      clubId,
      attendanceDate: {
        $gte: dayRange.startDate,
        $lte: dayRange.endDate,
      },
    })
      .select("studentId status markedAt submittedAt markedBy")
      .populate({
        path: "studentId",
        select: STUDENT_FIELDS,
        populate: STUDENT_POPULATE,
      })
      .populate({
        path: "markedBy",
        select: "name email role",
      })
      .lean();

    const submitted = attendanceRecords.length > 0;

    const students = attendanceRecords
      .filter((record) => {
        const student = record.studentId;

        if (!student) {
          return false;
        }

        // HOD SECURITY: only students of the HOD's department
        if (req.user.role === "HOD") {
          return (
            student.departmentId &&
            String(student.departmentId._id) ===
              String(req.user.departmentId)
          );
        }

        return true;
      })
      .map((record) => {
        const student = record.studentId;
        const user = student.userId;

        return {
          studentId: student._id,

          name: user?.name || "",
          email: user?.email || "",

          registerNumber: student.registerNumber,

          department: formatDepartment(student.departmentId),

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
      })
      .sort(byRegisterNumber);

    return res.status(200).json({
      success: true,
      attendanceDate,
      submitted,
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
