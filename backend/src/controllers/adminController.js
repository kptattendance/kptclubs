import StudentProfile from "../models/StudentProfile.js";
import ClubMembership from "../models/ClubMembership.js";
import Department from "../models/Department.js";
import Club from "../models/Club.js";


// =====================================================
// PUBLIC REGISTRATION SUMMARY
// GET /api/admin/registration-summary
//
// Query parameters:
//
// department=ALL
// semester=ALL
// club=ALL
//
// Examples:
//
// /api/admin/registration-summary
// /api/admin/registration-summary?department=ID
// /api/admin/registration-summary?semester=3
// /api/admin/registration-summary?club=ID
// /api/admin/registration-summary?department=ID&semester=3&club=ID
// =====================================================

export const getAdminRegistrationSummary = async (
  req,
  res
) => {
  try {

    console.log(
      "========== PUBLIC REGISTRATION SUMMARY =========="
    );

    // =================================================
    // GET FILTERS
    // =================================================

    const {
      department = "ALL",
      semester = "ALL",
      club = "ALL",
    } = req.query;

    console.log(
      "Department Filter:",
      department
    );

    console.log(
      "Semester Filter:",
      semester
    );

    console.log(
      "Club Filter:",
      club
    );


    // =================================================
    // GET ALL DEPARTMENTS
    // =================================================

    const departments =
      await Department.find({})
        .select("_id code name")
        .sort({
          name: 1,
        })
        .lean();


    // =================================================
    // GET ALL ACTIVE STUDENTS
    // =================================================

    const students =
      await StudentProfile.find({
        status: "ACTIVE",
      })
        .select(
          "_id departmentId semester registerNumber"
        )
        .lean();


    console.log(
      "Active Students:",
      students.length
    );


    // =================================================
    // CREATE STUDENT MAP
    // =================================================

    const studentMap = new Map();

    students.forEach((student) => {

      studentMap.set(
        student._id.toString(),
        student
      );

    });


    // =================================================
    // GET CONFIRMED CLUB MEMBERSHIPS
    // =================================================

    const memberships =
      await ClubMembership.find({
        status: "CONFIRMED",
      })
        .select(
          "_id studentId clubId status"
        )
        .populate(
          "clubId",
          "_id code name"
        )
        .lean();


    console.log(
      "Confirmed Memberships:",
      memberships.length
    );


    // =================================================
    // FILTER MEMBERSHIPS
    // =================================================

    const filteredMemberships =
      memberships.filter(
        (membership) => {

          const student =
            studentMap.get(
              membership.studentId?.toString()
            );


          // Student must exist
          if (!student) {
            return false;
          }


          // =============================================
          // DEPARTMENT FILTER
          // =============================================

          if (department !== "ALL") {

            if (
              student.departmentId?.toString() !==
              department.toString()
            ) {
              return false;
            }

          }


          // =============================================
          // SEMESTER FILTER
          // =============================================

          if (semester !== "ALL") {

            if (
              Number(student.semester) !==
              Number(semester)
            ) {
              return false;
            }

          }


          // =============================================
          // CLUB FILTER
          // =============================================

          if (club !== "ALL") {

            if (
              membership.clubId?._id?.toString() !==
              club.toString()
            ) {
              return false;
            }

          }


          return true;

        }
      );


    console.log(
      "Filtered Registrations:",
      filteredMemberships.length
    );


    // =================================================
    // CREATE DEPARTMENT MAP
    // =================================================

    const departmentMap = new Map();


    departments.forEach(
      (department) => {

        departmentMap.set(
          department._id.toString(),
          {
            departmentId:
              department._id,

            departmentCode:
              department.code,

            departmentName:
              department.name,

            semesters: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
              6: 0,
            },

            total: 0,
          }
        );

      }
    );


    // =================================================
    // COUNT REGISTRATIONS
    // =================================================

    filteredMemberships.forEach(
      (membership) => {

        const student =
          studentMap.get(
            membership.studentId?.toString()
          );


        if (!student) {
          return;
        }


        const departmentId =
          student.departmentId?.toString();


        const semesterNumber =
          Number(student.semester);


        const departmentData =
          departmentMap.get(
            departmentId
          );


        if (!departmentData) {
          return;
        }


        // Only semesters 1-6

        if (
          semesterNumber < 1 ||
          semesterNumber > 6
        ) {
          return;
        }


        departmentData.semesters[
          semesterNumber
        ]++;


        departmentData.total++;

      }
    );


    // =================================================
    // APPLY DEPARTMENT FILTER
    // =================================================

    let summary =
      Array.from(
        departmentMap.values()
      );


    if (department !== "ALL") {

      summary =
        summary.filter(
          (item) =>
            item.departmentId.toString() ===
            department.toString()
        );

    }


    // =================================================
    // SEMESTER TOTALS
    // =================================================

    const semesterTotals = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };


    summary.forEach(
      (departmentData) => {

        Object.keys(
          departmentData.semesters
        ).forEach(
          (semesterNumber) => {

            semesterTotals[
              semesterNumber
            ] +=
              departmentData.semesters[
                semesterNumber
              ];

          }
        );

      }
    );


    // =================================================
    // GRAND TOTAL
    // =================================================

    const grandTotal =
      summary.reduce(
        (total, departmentData) =>
          total + departmentData.total,
        0
      );


    // =================================================
    // GET ALL ACTIVE CLUBS
    // =================================================

    const clubs =
      await Club.find({
        isActive: true,
      })
        .select(
          "_id code name type"
        )
        .sort({
          name: 1,
        })
        .lean();


    // =================================================
    // CLUB COUNTS
    // =================================================

    const clubCounts = {};


    filteredMemberships.forEach(
      (membership) => {

        const clubId =
          membership.clubId?._id?.toString();


        if (!clubId) {
          return;
        }


        if (!clubCounts[clubId]) {

          clubCounts[clubId] = {

            clubId:
              membership.clubId._id,

            code:
              membership.clubId.code,

            name:
              membership.clubId.name,

            count: 0,

          };

        }


        clubCounts[clubId].count++;

      }
    );


    const clubSummary =
      Object.values(
        clubCounts
      ).sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      );


    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({

      success: true,

      filters: {
        department,
        semester,
        club,
      },

      stats: {

        grandTotal,

        totalDepartments:
          summary.length,

        totalClubs:
          clubSummary.length,

        semesterTotals,

      },

      departments:
        summary,

      clubs:
        clubSummary,

      availableDepartments:
        departments,

      availableClubs:
        clubs,

    });

  } catch (error) {

    console.error(
      "Public registration summary error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to load registration summary",

    });

  }
};