"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";
import * as XLSX from "xlsx";

export default function AttendancePage() {
  const { getToken } = useAuth();

  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState("");

  const [students, setStudents] = useState([]);
  const [classDates, setClassDates] = useState([]);
  const [totalClasses, setTotalClasses] = useState(0);

  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingAttendance, setLoadingAttendance] =
    useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // FILTERS
  // =====================================================

  const [search, setSearch] = useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("ALL");

  const [semesterFilter, setSemesterFilter] =
    useState("ALL");

  const [attendanceFilter, setAttendanceFilter] =
    useState("ALL");

  const [certificateFilter, setCertificateFilter] =
    useState("ALL");


// =====================================================
// EXCEL REPORT
// =====================================================

const downloadExcelReport = () => {
  if (!selectedClub || filteredStudents.length === 0) {
    return;
  }

  const selectedClubName =
    clubs.find(
      (club) =>
        String(club._id || club.id) ===
        String(selectedClub)
    )?.name || "Club";

  // -----------------------------------------------------
  // CREATE HEADERS
  // -----------------------------------------------------

  const headers = [
    "Sl No",
    "Student Name",
    "Register Number",
    "Department",
    "Semester",
  ];

  // Add every attendance date
  classDates.forEach((date) => {
    headers.push(
      `${formatDate(date)} (${getDay(date)})`
    );
  });

  headers.push(
    "Attended",
    "Total Classes",
    "Attendance %",
    "Certificate Status"
  );

  // -----------------------------------------------------
  // CREATE DATA
  // -----------------------------------------------------

  const rows = filteredStudents.map(
    (student, index) => {
      const row = {
        "Sl No": index + 1,

        "Student Name":
          student.name?.toUpperCase() || "",

        "Register Number":
          student.registerNumber || "",

        Department:
          student.department?.code || "",

        Semester:
          student.semester || "",
      };

      // Attendance for every date
      classDates.forEach((date) => {
        const record =
          student.attendanceHistory?.find(
            (item) =>
              item.date === date
          );

        row[
          `${formatDate(date)} (${getDay(date)})`
        ] = record
          ? record.status === "PRESENT"
            ? "PRESENT"
            : "ABSENT"
          : "-";
      });

      // Summary
      row["Attended"] =
        student.attendedClasses || 0;

      row["Total Classes"] =
        student.totalClasses || 0;

      row["Attendance %"] =
        `${student.percentage || 0}%`;

      row["Certificate Status"] =
        getCertificateLabel(student);

      return row;
    }
  );

  // -----------------------------------------------------
  // CREATE WORKSHEET
  // -----------------------------------------------------

  const worksheet =
    XLSX.utils.json_to_sheet(rows);

  // -----------------------------------------------------
  // COLUMN WIDTHS
  // -----------------------------------------------------

  worksheet["!cols"] = [
    { wch: 8 },   // Sl No
    { wch: 28 },  // Name
    { wch: 18 },  // Register
    { wch: 12 },  // Department
    { wch: 10 },  // Semester

    // Attendance date columns
    ...classDates.map(() => ({
      wch: 20,
    })),

    { wch: 12 },  // Attended
    { wch: 15 },  // Total
    { wch: 16 },  // Percentage
    { wch: 20 },  // Certificate
  ];

  // -----------------------------------------------------
  // FREEZE FIRST 5 COLUMNS
  // -----------------------------------------------------

  worksheet["!freeze"] = {
    xSplit: 5,
    ySplit: 1,
  };

  // -----------------------------------------------------
  // CREATE WORKBOOK
  // -----------------------------------------------------

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Attendance Report"
  );

  // -----------------------------------------------------
  // FILE NAME
  // -----------------------------------------------------

  const safeClubName =
    selectedClubName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_");

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const fileName =
    `${safeClubName}_Attendance_Report_${today}.xlsx`;

  // -----------------------------------------------------
  // DOWNLOAD
  // -----------------------------------------------------

  XLSX.writeFile(
    workbook,
    fileName
  );
};

  // =====================================================
  // LOAD CLUBS
  // =====================================================

  const loadClubs = async () => {
    try {
      setLoadingClubs(true);
      setError("");

      const token = await getToken();

      const response = await api.get("/api/clubs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
            "Failed to load clubs"
        );
      }

      setClubs(response.data.clubs || []);
    } catch (err) {
      console.error("Load clubs error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load clubs"
      );
    } finally {
      setLoadingClubs(false);
    }
  };

  // =====================================================
  // LOAD DETAILED ATTENDANCE
  //
  // NEW ENDPOINT
  // Existing attendance workflow is untouched.
  // =====================================================

  const loadAttendance = async () => {
    if (!selectedClub) {
      setStudents([]);
      setClassDates([]);
      setTotalClasses(0);
      return;
    }

    try {
      setLoadingAttendance(true);
      setError("");

      const token = await getToken();

      const response = await api.get(
        `/api/attendance/club-details?clubId=${selectedClub}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
            "Failed to load attendance"
        );
      }

      setStudents(
        response.data.students || []
      );

      setClassDates(
        response.data.classDates || []
      );

      setTotalClasses(
        response.data.totalClasses || 0
      );
    } catch (err) {
      console.error(
        "Load detailed attendance error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load attendance"
      );

      setStudents([]);
      setClassDates([]);
      setTotalClasses(0);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadClubs();
  }, []);

  // =====================================================
  // LOAD WHEN CLUB CHANGES
  // =====================================================

  useEffect(() => {
    loadAttendance();
  }, [selectedClub]);

  // =====================================================
  // DEPARTMENTS
  // =====================================================

  const departments = useMemo(() => {
    const map = new Map();

    students.forEach((student) => {
      if (!student.department) return;

      const id =
        student.department._id ||
        student.department.code;

      if (!map.has(id)) {
        map.set(id, student.department);
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.code || "").localeCompare(
        String(b.code || "")
      )
    );
  }, [students]);

  // =====================================================
  // FILTERED STUDENTS
  // =====================================================

  const filteredStudents = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return students
      .filter((student) => {
        // SEARCH
        if (searchText) {
          const text = [
            student.name,
            student.email,
            student.registerNumber,
            student.department?.code,
            student.department?.name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!text.includes(searchText)) {
            return false;
          }
        }

        // DEPARTMENT
        if (
          departmentFilter !== "ALL" &&
          String(student.department?._id) !==
            String(departmentFilter)
        ) {
          return false;
        }

        // SEMESTER
        if (
          semesterFilter !== "ALL" &&
          String(student.semester) !==
            String(semesterFilter)
        ) {
          return false;
        }

        // ATTENDANCE
        if (
          attendanceFilter === "75_PLUS" &&
          Number(student.percentage || 0) < 75
        ) {
          return false;
        }

        if (
          attendanceFilter === "BELOW_75" &&
          Number(student.percentage || 0) >= 75
        ) {
          return false;
        }

        // CERTIFICATE
        if (
          certificateFilter === "ALLOWED" &&
          !student.certificateAllowed
        ) {
          return false;
        }

        if (
          certificateFilter === "PENDING" &&
          student.certificateStatus !== "ELIGIBLE"
        ) {
          return false;
        }

        if (
          certificateFilter === "ISSUED" &&
          student.certificateStatus !== "ISSUED"
        ) {
          return false;
        }

        if (
          certificateFilter === "NOT_AVAILABLE" &&
          student.certificateStatus
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) =>
        String(a.name || "").localeCompare(
          String(b.name || "")
        )
      );
  }, [
    students,
    search,
    departmentFilter,
    semesterFilter,
    attendanceFilter,
    certificateFilter,
  ]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalStudents = students.length;

  const averageAttendance =
    totalStudents > 0
      ? Math.round(
          students.reduce(
            (sum, student) =>
              sum +
              Number(student.percentage || 0),
            0
          ) / totalStudents
        )
      : 0;

  const above75 = students.filter(
    (student) =>
      Number(student.percentage || 0) >= 75
  ).length;

  const certificateAllowed = students.filter(
    (student) =>
      student.certificateAllowed
  ).length;

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("ALL");
    setSemesterFilter("ALL");
    setAttendanceFilter("ALL");
    setCertificateFilter("ALL");
  };

  const hasFilters =
    search ||
    departmentFilter !== "ALL" ||
    semesterFilter !== "ALL" ||
    attendanceFilter !== "ALL" ||
    certificateFilter !== "ALL";

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsed =
      new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
      }
    );
  };

  // =====================================================
  // GET DAY
  // =====================================================

  const getDay = (date) => {
    if (!date) return "";

    const parsed =
      new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        weekday: "short",
      }
    );
  };

  // =====================================================
  // ATTENDANCE MAP
  // =====================================================

  const getAttendanceStatus = (
    student,
    date
  ) => {
    const record =
      student.attendanceHistory?.find(
        (item) =>
          item.date === date
      );

    if (!record) {
      return "-";
    }

    return record.status === "PRESENT"
      ? "P"
      : "A";
  };

  // =====================================================
  // CERTIFICATE LABEL
  // =====================================================

  const getCertificateLabel = (
    student
  ) => {
    if (
      student.certificateStatus ===
      "ISSUED"
    ) {
      return "Issued";
    }

    if (
      student.certificateStatus ===
      "APPROVED"
    ) {
      return "Allowed";
    }

    if (
      student.certificateStatus ===
      "ELIGIBLE"
    ) {
      return "Pending";
    }

    if (
      student.certificateStatus ===
      "REJECTED"
    ) {
      return "Rejected";
    }

    return "—";
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-[1700px] px-3 py-4 sm:px-5 lg:px-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Attendance
            </h1>

            <p className="mt-0.5 text-xs text-slate-500">
              Daily attendance and certificate status
            </p>
          </div>

          {selectedClub && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              {
                clubs.find(
                  (club) =>
                    String(
                      club._id || club.id
                    ) ===
                    String(selectedClub)
                )?.name ||
                "Selected Club"
              }
            </div>
          )}

        </div>


        {/* =================================================
            CLUB + FILTERS
        ================================================= */}

        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">

            {/* CLUB */}

            <div className="lg:col-span-2">

              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Club
              </label>

              <select
                value={selectedClub}
                onChange={(e) =>
                  setSelectedClub(
                    e.target.value
                  )
                }
                disabled={loadingClubs}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >

                <option value="">
                  Select Club
                </option>

                {clubs.map((club) => (
                  <option
                    key={
                      club._id ||
                      club.id
                    }
                    value={
                      club._id ||
                      club.id
                    }
                  >
                    {club.name}
                  </option>
                ))}

              </select>

            </div>


            {/* SEARCH */}

            <div className="lg:col-span-2">

              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Name / register number..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* DEPARTMENT */}

            <FilterSelect
              label="Department"
              value={
                departmentFilter
              }
              onChange={
                setDepartmentFilter
              }
              options={[
                {
                  value: "ALL",
                  label:
                    "All Departments",
                },
                ...departments.map(
                  (department) => ({
                    value:
                      department._id,
                    label:
                      department.code ||
                      department.name,
                  })
                ),
              ]}
            />


            {/* SEMESTER */}

            <FilterSelect
              label="Semester"
              value={
                semesterFilter
              }
              onChange={
                setSemesterFilter
              }
              options={[
                {
                  value: "ALL",
                  label:
                    "All Semesters",
                },
                ...[1, 2, 3, 4, 5, 6].map(
                  (sem) => ({
                    value: String(sem),
                    label: `Sem ${sem}`,
                  })
                ),
              ]}
            />

          </div>


          <div className="mt-3 grid gap-3 sm:grid-cols-3">

            {/* ATTENDANCE FILTER */}

            <FilterSelect
              label="Attendance"
              value={
                attendanceFilter
              }
              onChange={
                setAttendanceFilter
              }
              options={[
                {
                  value: "ALL",
                  label:
                    "All Attendance",
                },
                {
                  value:
                    "75_PLUS",
                  label:
                    "75% & Above",
                },
                {
                  value:
                    "BELOW_75",
                  label:
                    "Below 75%",
                },
              ]}
            />


            {/* CERTIFICATE FILTER */}

            <FilterSelect
              label="Certificate"
              value={
                certificateFilter
              }
              onChange={
                setCertificateFilter
              }
              options={[
                {
                  value: "ALL",
                  label:
                    "All Certificate",
                },
                {
                  value:
                    "ALLOWED",
                  label:
                    "Generation Allowed",
                },
                {
                  value:
                    "PENDING",
                  label:
                    "Pending Approval",
                },
                {
                  value:
                    "ISSUED",
                  label:
                    "Already Issued",
                },
                {
                  value:
                    "NOT_AVAILABLE",
                  label:
                    "Not Available",
                },
              ]}
            />


            {/* CLEAR */}

            <div className="flex items-end">

              {hasFilters ? (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              ) : (
                <div className="w-full rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Showing all students
                </div>
              )}

            </div>

          </div>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* =================================================
            NO CLUB
        ================================================= */}

        {!selectedClub &&
          !loadingClubs && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">

              <div className="text-3xl">
                📋
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                Select a club
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Attendance details will appear here.
              </p>

            </div>
          )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loadingAttendance && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-2 text-xs text-slate-500">
              Loading attendance...
            </p>

          </div>
        )}


        {/* =================================================
            SUMMARY
        ================================================= */}

        {!loadingAttendance &&
          selectedClub &&
          students.length > 0 && (

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">

              <SummaryCard
                label="Classes"
                value={totalClasses}
                type="slate"
              />

              <SummaryCard
                label="Students"
                value={totalStudents}
                type="blue"
              />

              <SummaryCard
                label="75% & Above"
                value={above75}
                type="green"
              />

              <SummaryCard
                label="Certificate Allowed"
                value={
                  certificateAllowed
                }
                type="emerald"
              />

            </div>
          )}


        {/* =================================================
            TABLE
        ================================================= */}

        {!loadingAttendance &&
          selectedClub &&
          students.length > 0 && (

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              {/* TABLE HEADER */}

             <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">

  <div>
    <p className="text-sm font-bold text-slate-800">
      Daily Attendance
    </p>

    <p className="text-[11px] text-slate-500">
      Showing{" "}
      {filteredStudents.length}{" "}
      of{" "}
      {students.length}{" "}
      students •{" "}
      {totalClasses}{" "}
      attendance days
    </p>
  </div>

  <div className="flex items-center gap-2">

    <div className="hidden text-[10px] text-slate-400 lg:block">
      ← Scroll horizontally →
    </div>

    <button
      type="button"
      onClick={downloadExcelReport}
      disabled={
        filteredStudents.length === 0
      }
      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>📊</span>
      <span>Download Excel</span>
    </button>

  </div>

</div>


              {/* HORIZONTAL SCROLL */}

              <div className="max-h-[calc(100vh-300px)] overflow-auto">

                <table className="min-w-max border-collapse text-xs">

                  {/* =================================================
                      HEADER
                  ================================================= */}

                  <thead className="sticky top-0 z-30">

                    <tr className="bg-slate-100">

                      {/* SL */}

                      <th className="sticky left-0 z-40 w-10 border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-center text-[10px] font-bold text-slate-500">
                        #
                      </th>


                      {/* STUDENT */}

                      <th className="sticky left-10 z-40 min-w-[190px] border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Student
                      </th>


                      {/* REGISTER */}

                      <th className="sticky left-[230px] z-40 min-w-[105px] border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Register No.
                      </th>


                      {/* DEPARTMENT */}

                      <th className="sticky left-[335px] z-40 min-w-[65px] border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Dept
                      </th>


                      {/* SEM */}

                      <th className="sticky left-[400px] z-40 min-w-[55px] border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Sem
                      </th>


                      {/* DATES */}

                      {classDates.map(
                        (date) => (
                          <th
                            key={date}
                            className="min-w-[72px] border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-center"
                          >

                            <div className="font-bold text-slate-700">
                              {
                                formatDate(
                                  date
                                )
                              }
                            </div>

                            <div className="mt-0.5 text-[9px] font-medium text-slate-400">
                              {
                                getDay(
                                  date
                                )
                              }
                            </div>

                          </th>
                        )
                      )}


                      {/* ATTENDED */}

                      <th className="min-w-[65px] border-b border-r border-slate-200 bg-blue-50 px-2 py-2 text-center text-[10px] font-bold text-blue-700">
                        Att.
                      </th>


                      {/* TOTAL */}

                      <th className="min-w-[65px] border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-center text-[10px] font-bold text-slate-600">
                        Total
                      </th>


                      {/* PERCENTAGE */}

                      <th className="min-w-[75px] border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-center text-[10px] font-bold text-slate-600">
                        %
                      </th>


                      {/* CERTIFICATE */}

                      <th className="min-w-[105px] border-b border-slate-200 bg-slate-100 px-2 py-2 text-center text-[10px] font-bold text-slate-600">
                        Certificate
                      </th>

                    </tr>

                  </thead>


                  {/* =================================================
                      BODY
                  ================================================= */}

                  <tbody>

                    {filteredStudents.map(
                      (
                        student,
                        index
                      ) => {

                        const percentage =
                          Number(
                            student.percentage ||
                              0
                          );

                        return (

                          <tr
                            key={
                              student.studentId
                            }
                            className="group hover:bg-blue-50/40"
                          >

                            {/* SL */}

                            <td className="sticky left-0 z-20 border-b border-r border-slate-100 bg-white px-2 py-2 text-center text-[10px] text-slate-400 group-hover:bg-blue-50/40">
                              {index + 1}
                            </td>


                            {/* STUDENT */}

                            <td className="sticky left-10 z-20 min-w-[190px] border-b border-r border-slate-100 bg-white px-3 py-2 group-hover:bg-blue-50/40">

                              <div className="flex items-center gap-2">

                                {student.photoUrl ? (

                                  <img
                                    src={
                                      student.photoUrl
                                    }
                                    alt=""
                                    className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                                  />

                                ) : (

                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                                    {
                                      student.name
                                        ?.charAt(
                                          0
                                        )
                                        ?.toUpperCase() ||
                                      "S"
                                    }
                                  </div>

                                )}

                                <div className="min-w-0">

                                  <p className="max-w-[140px] truncate text-[11px] font-bold text-slate-800">
                                    {
                                      student.name?.toUpperCase() ||
                                      "-"
                                    }
                                  </p>

                                  <p className="max-w-[140px] truncate text-[9px] text-slate-400">
                                    {
                                      student.email ||
                                      "-"
                                    }
                                  </p>

                                </div>

                              </div>

                            </td>


                            {/* REGISTER */}

                            <td className="sticky left-[230px] z-20 border-b border-r border-slate-100 bg-white px-2 py-2 text-[10px] font-semibold text-slate-600 group-hover:bg-blue-50/40">
                              {
                                student.registerNumber ||
                                "-"
                              }
                            </td>


                            {/* DEPARTMENT */}

                            <td className="sticky left-[335px] z-20 border-b border-r border-slate-100 bg-white px-2 py-2 text-center group-hover:bg-blue-50/40">

                              <span className="rounded bg-slate-100 px-1.5 py-1 text-[9px] font-bold text-slate-600">
                                {
                                  student.department
                                    ?.code ||
                                  "-"
                                }
                              </span>

                            </td>


                            {/* SEMESTER */}

                            <td className="sticky left-[400px] z-20 border-b border-r border-slate-100 bg-white px-2 py-2 text-center text-[10px] font-semibold text-slate-600 group-hover:bg-blue-50/40">
                              {
                                student.semester ||
                                "-"
                              }
                            </td>


                            {/* EACH DATE */}

                            {classDates.map(
                              (date) => {

                                const status =
                                  getAttendanceStatus(
                                    student,
                                    date
                                  );

                                return (

                                  <td
                                    key={
                                      date
                                    }
                                    className={`border-b border-r border-slate-100 px-2 py-2 text-center ${
                                      status ===
                                      "P"
                                        ? "bg-green-50/40"
                                        : status ===
                                          "A"
                                        ? "bg-red-50/40"
                                        : ""
                                    }`}
                                  >

                                    {status ===
                                    "P" ? (

                                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-green-100 text-[10px] font-extrabold text-green-700">
                                        P
                                      </span>

                                    ) : status ===
                                      "A" ? (

                                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-red-100 text-[10px] font-extrabold text-red-700">
                                        A
                                      </span>

                                    ) : (

                                      <span className="text-slate-300">
                                        —
                                      </span>

                                    )}

                                  </td>

                                );
                              }
                            )}


                            {/* ATTENDED */}

                            <td className="border-b border-r border-slate-100 bg-blue-50/50 px-2 py-2 text-center text-[11px] font-bold text-blue-700">
                              {
                                student.attendedClasses ||
                                0
                              }
                            </td>


                            {/* TOTAL */}

                            <td className="border-b border-r border-slate-100 px-2 py-2 text-center text-[11px] font-semibold text-slate-600">
                              {
                                student.totalClasses ||
                                0
                              }
                            </td>


                            {/* PERCENTAGE */}

                            <td className="border-b border-r border-slate-100 px-2 py-2 text-center">

                              <span
                                className={`inline-flex min-w-[48px] justify-center rounded-full px-2 py-1 text-[10px] font-bold ${
                                  percentage >=
                                  75
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {
                                  percentage
                                }%
                              </span>

                            </td>


                            {/* CERTIFICATE */}

                            <td className="border-b border-slate-100 px-2 py-2 text-center">

                              <CertificateBadge
                                student={
                                  student
                                }
                              />

                            </td>

                          </tr>

                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>


              {/* TABLE FOOTER */}

              <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  P = Present &nbsp;•&nbsp;
                  A = Absent
                </div>

                <div>
                  {
                    filteredStudents.length
                  }{" "}
                  students shown
                </div>

              </div>

            </div>
          )}


        {/* =================================================
            NO DATA
        ================================================= */}

        {!loadingAttendance &&
          selectedClub &&
          students.length === 0 && (

            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">

              <div className="text-3xl">
                📋
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                No attendance records found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Attendance will appear here after it is submitted.
              </p>

            </div>
          )}

      </div>

    </div>
  );
}


// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  label,
  value,
  type,
}) {
  const styles = {
    slate:
      "bg-white text-slate-900",

    blue:
      "bg-blue-50 text-blue-700",

    green:
      "bg-green-50 text-green-700",

    emerald:
      "bg-emerald-50 text-emerald-700",
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 px-3 py-2.5 shadow-sm ${styles[type]}`}
    >

      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
        {label}
      </p>

      <p className="mt-0.5 text-xl font-extrabold">
        {value}
      </p>

    </div>
  );
}


// =====================================================
// FILTER SELECT
// =====================================================

function FilterSelect({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>

      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >

        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}

      </select>

    </div>
  );
}


// =====================================================
// CERTIFICATE BADGE
// =====================================================

function CertificateBadge({
  student,
}) {
  let label = "—";

  let className =
    "bg-slate-100 text-slate-500";

  if (
    student.certificateStatus ===
    "APPROVED"
  ) {
    label = "Allowed";
    className =
      "bg-green-100 text-green-700";
  }

  if (
    student.certificateStatus ===
    "ISSUED"
  ) {
    label = "Issued";
    className =
      "bg-blue-100 text-blue-700";
  }

  if (
    student.certificateStatus ===
    "ELIGIBLE"
  ) {
    label = "Pending";
    className =
      "bg-amber-100 text-amber-700";
  }

  if (
    student.certificateStatus ===
    "REJECTED"
  ) {
    label = "Rejected";
    className =
      "bg-red-100 text-red-700";
  }

  return (
    <span
      className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-[9px] font-bold ${className}`}
    >
      {label}
    </span>
  );
}