"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";
import * as XLSX from "xlsx";

export default function HODAttendancePage() {
  const { getToken, isLoaded } = useAuth();

  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState("");

  const [students, setStudents] = useState([]);
  const [classDates, setClassDates] = useState([]);

  const [summary, setSummary] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    attendance75Plus: 0,
    certificateAllowed: 0,
  });

  const [loadingClubs, setLoadingClubs] =
    useState(true);

  const [loadingAttendance, setLoadingAttendance] =
    useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [semesterFilter, setSemesterFilter] =
    useState("ALL");

  // =====================================================
  // LOAD CLUBS
  // =====================================================

  const loadClubs = async () => {
    try {
      setLoadingClubs(true);
      setError("");

      const token = await getToken();

      const response = await api.get(
        "/api/clubs",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load clubs"
        );
      }

      setClubs(
        response.data.clubs || []
      );
    } catch (error) {
      console.error(
        "Load HOD clubs error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load clubs"
      );
    } finally {
      setLoadingClubs(false);
    }
  };

  // =====================================================
  // LOAD DETAILED ATTENDANCE
  // =====================================================

  const loadAttendance = async () => {
    if (!selectedClub) {
      setStudents([]);
      setClassDates([]);

      setSummary({
        totalStudents: 0,
        averageAttendance: 0,
        attendance75Plus: 0,
        certificateAllowed: 0,
      });

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

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load attendance"
        );
      }

      setStudents(
        response.data.students || []
      );

      setClassDates(
        response.data.classDates || []
      );

      setSummary(
        response.data.summary || {
          totalStudents: 0,
          averageAttendance: 0,
          attendance75Plus: 0,
          certificateAllowed: 0,
        }
      );
    } catch (error) {
      console.error(
        "Load detailed attendance error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load attendance"
      );

      setStudents([]);
      setClassDates([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!isLoaded) return;

    loadClubs();
  }, [isLoaded]);

  // =====================================================
  // LOAD ATTENDANCE WHEN CLUB CHANGES
  // =====================================================

  useEffect(() => {
    if (!isLoaded) return;

    loadAttendance();
  }, [selectedClub]);

  // =====================================================
  // FILTERED STUDENTS
  // =====================================================

  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (semesterFilter !== "ALL") {
      result = result.filter(
        (student) =>
          String(student.semester) ===
          String(semesterFilter)
      );
    }

    if (search.trim()) {
      const value =
        search.trim().toLowerCase();

      result = result.filter((student) => {
        return (
          student.name
            ?.toLowerCase()
            .includes(value) ||
          student.registerNumber
            ?.toLowerCase()
            .includes(value) ||
          student.email
            ?.toLowerCase()
            .includes(value)
        );
      });
    }

    return result;
  }, [
    students,
    semesterFilter,
    search,
  ]);

  // =====================================================
  // FIND ATTENDANCE STATUS FOR DATE
  // =====================================================

  const getAttendanceStatus = (
    student,
    date
  ) => {
    const record =
      student.attendanceHistory?.find(
        (item) => item.date === date
      );

    return record?.status || null;
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    const value = new Date(
      `${date}T00:00:00Z`
    );

    return value.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      }
    );
  };

  // =====================================================
  // GET DAY
  // =====================================================

  const getDay = (date) => {
    const value = new Date(
      `${date}T00:00:00Z`
    );

    return value.toLocaleDateString(
      "en-IN",
      {
        weekday: "short",
        timeZone: "UTC",
      }
    );
  };

  // =====================================================
  // EXCEL - SUMMARY
  // =====================================================

  const downloadSummaryExcel = () => {
    if (!filteredStudents.length) {
      setError(
        "No students available for Excel download."
      );
      return;
    }

    const selectedClubObject =
      clubs.find(
        (club) =>
          String(
            club._id || club.id
          ) ===
          String(selectedClub)
      );

    const excelData =
      filteredStudents.map(
        (student, index) => ({
          "Sl No": index + 1,

          "Student Name":
            student.name?.toUpperCase() ||
            "",

          "Register Number":
            student.registerNumber || "",

          Department:
            student.department?.code ||
            "",

          Semester:
            student.semester || "",

          "Admission Year":
            student.admissionYear || "",

          "Classes Attended":
            student.attendedClasses || 0,

          "Total Classes":
            student.totalClasses || 0,

          "Attendance %":
            student.percentage || 0,

          "Certificate Status":
            student.certificateStatus ||
            "NOT GENERATED",

          "Certificate Allowed":
            student.certificateAllowed
              ? "YES"
              : "NO",
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        excelData
      );

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Attendance Summary"
    );

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    XLSX.writeFile(
      workbook,
      `HOD_Attendance_Summary_${
        selectedClubObject?.code ||
        "Club"
      }_${today}.xlsx`
    );
  };

  // =====================================================
  // EXCEL - DETAILED ATTENDANCE
  // =====================================================

  const downloadDetailedExcel = () => {
    if (!filteredStudents.length) {
      setError(
        "No students available for Excel download."
      );
      return;
    }

    const selectedClubObject =
      clubs.find(
        (club) =>
          String(
            club._id || club.id
          ) ===
          String(selectedClub)
      );

    const excelData =
      filteredStudents.map(
        (student, index) => {
          const row = {
            "Sl No": index + 1,

            "Student Name":
              student.name?.toUpperCase() ||
              "",

            "Register Number":
              student.registerNumber || "",

            Department:
              student.department?.code ||
              "",

            Semester:
              student.semester || "",

            "Admission Year":
              student.admissionYear || "",
          };

          classDates.forEach(
            (date) => {
              const status =
                getAttendanceStatus(
                  student,
                  date
                );

              row[
                `${formatDate(date)} (${getDay(
                  date
                )})`
              ] =
                status === "PRESENT"
                  ? "P"
                  : status === "ABSENT"
                    ? "A"
                    : "-";
            }
          );

          row["Classes Attended"] =
            student.attendedClasses || 0;

          row["Total Classes"] =
            student.totalClasses || 0;

          row["Attendance %"] =
            student.percentage || 0;

          row["Certificate Status"] =
            student.certificateStatus ||
            "NOT GENERATED";

          row["Certificate Allowed"] =
            student.certificateAllowed
              ? "YES"
              : "NO";

          return row;
        }
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        excelData
      );

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 16 },
      ...classDates.map(() => ({
        wch: 15,
      })),
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Detailed Attendance"
    );

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    XLSX.writeFile(
      workbook,
      `HOD_Detailed_Attendance_${
        selectedClubObject?.code ||
        "Club"
      }_${today}.xlsx`
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-gray-500">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-full bg-gray-50 p-3 sm:p-5">
      <div className="mx-auto max-w-[1600px]">

        {/* HEADER */}
        <div className="mb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                  📊
                </div>

                <div>
                  <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Department Attendance
                  </h1>

                  <p className="mt-0.5 text-sm text-gray-500">
                    Detailed club attendance for your department
                  </p>
                </div>
              </div>
            </div>

            {selectedClub &&
              students.length > 0 && (
                <div className="flex flex-wrap gap-2">

                  <button
                    type="button"
                    onClick={
                      downloadSummaryExcel
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                  >
                    📊 Summary Excel
                  </button>

                  <button
                    type="button"
                    onClick={
                      downloadDetailedExcel
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                  >
                    📥 Detailed Excel
                  </button>
                </div>
              )}
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* FILTER BAR */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

            {/* CLUB */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
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
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
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
                    {club.code
                      ? ` (${club.code})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* SEARCH */}
            <div className="md:col-span-2 xl:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Search Student
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by name, register number or email"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* SEMESTER */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Semester
              </label>

              <select
                value={semesterFilter}
                onChange={(e) =>
                  setSemesterFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">
                  All Semesters
                </option>

                {[1, 2, 3, 4, 5, 6].map(
                  (semester) => (
                    <option
                      key={semester}
                      value={semester}
                    >
                      Semester {semester}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        {selectedClub &&
          !loadingAttendance && (
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

              <SummaryCard
                title="Students"
                value={
                  summary.totalStudents
                }
                icon="👥"
                className="bg-blue-50 text-blue-700"
              />

              <SummaryCard
                title="Classes"
                value={classDates.length}
                icon="📅"
                className="bg-purple-50 text-purple-700"
              />

              <SummaryCard
                title="Average"
                value={`${summary.averageAttendance || 0}%`}
                icon="📈"
                className="bg-cyan-50 text-cyan-700"
              />

              <SummaryCard
                title="75%+"
                value={
                  summary.attendance75Plus ||
                  0
                }
                icon="✓"
                className="bg-green-50 text-green-700"
              />
            </div>
          )}

        {/* LOADING */}
        {loadingAttendance && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-medium text-gray-600">
              Loading detailed attendance...
            </p>
          </div>
        )}

        {/* NO CLUB */}
        {!selectedClub &&
          !loadingClubs && (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="text-4xl">
                📊
              </div>

              <p className="mt-4 text-sm font-bold text-gray-700">
                Select a club
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Detailed attendance will appear here.
              </p>
            </div>
          )}

        {/* NO STUDENTS */}
        {selectedClub &&
          !loadingAttendance &&
          students.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="text-4xl">
                👥
              </div>

              <p className="mt-4 text-sm font-bold text-gray-700">
                No attendance records
              </p>

              <p className="mt-1 text-xs text-gray-500">
                No students or attendance records are available for this club.
              </p>
            </div>
          )}

        {/* ATTENDANCE TABLE */}
        {!loadingAttendance &&
          filteredStudents.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

              {/* TABLE HEADER */}
              <div className="flex flex-col gap-2 border-b border-gray-200 bg-gray-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-sm font-bold text-gray-800">
                    Detailed Attendance Sheet
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    P = Present &nbsp; | &nbsp; A = Absent
                  </p>
                </div>

                <div className="text-xs font-semibold text-gray-500">
                  Showing{" "}
                  {filteredStudents.length}{" "}
                  of {students.length} students
                </div>
              </div>

              {/* HORIZONTAL SCROLL */}
              <div className="w-full overflow-x-auto overscroll-x-contain">

                <table className="w-full min-w-[1200px] text-sm">

                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>

                      <th className="sticky left-0 z-20 w-14 bg-gray-50 px-3 py-3 text-center text-xs font-bold text-gray-500">
                        #
                      </th>

                      <th className="sticky left-14 z-20 min-w-[220px] bg-gray-50 px-3 py-3 text-left text-xs font-bold text-gray-500">
                        STUDENT
                      </th>

                      <th className="min-w-[150px] px-3 py-3 text-left text-xs font-bold text-gray-500">
                        REGISTER NO.
                      </th>

                      <th className="min-w-[80px] px-3 py-3 text-center text-xs font-bold text-gray-500">
                        SEM
                      </th>

                      {classDates.map(
                        (date) => (
                          <th
                            key={date}
                            className="min-w-[85px] px-2 py-3 text-center text-xs font-bold text-gray-500"
                          >
                            <div>
                              {formatDate(
                                date
                              )}
                            </div>

                            <div className="mt-0.5 text-[10px] font-medium text-gray-400">
                              {getDay(date)}
                            </div>
                          </th>
                        )
                      )}

                      <th className="min-w-[90px] px-3 py-3 text-center text-xs font-bold text-gray-500">
                        ATTENDED
                      </th>

                      <th className="min-w-[80px] px-3 py-3 text-center text-xs font-bold text-gray-500">
                        TOTAL
                      </th>

                      <th className="min-w-[110px] px-3 py-3 text-center text-xs font-bold text-gray-500">
                        ATTENDANCE
                      </th>

                      <th className="min-w-[130px] px-3 py-3 text-center text-xs font-bold text-gray-500">
                        CERTIFICATE
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {filteredStudents.map(
                      (student, index) => {
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
                            className="transition hover:bg-gray-50"
                          >

                            {/* NUMBER */}
                            <td className="sticky left-0 z-10 bg-white px-3 py-3 text-center font-medium text-gray-400">
                              {index + 1}
                            </td>

                            {/* STUDENT */}
                            <td className="sticky left-14 z-10 bg-white px-3 py-3">

                              <div className="flex items-center gap-2.5">

                                {student.photoUrl ? (
                                  <img
                                    src={
                                      student.photoUrl
                                    }
                                    alt=""
                                    className="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                    {student.name
                                      ?.charAt(
                                        0
                                      )
                                      ?.toUpperCase() ||
                                      "S"}
                                  </div>
                                )}

                                <div className="min-w-0 max-w-[180px]">
                                  <p className="truncate font-bold text-gray-900">
                                    {student.name?.toUpperCase() ||
                                      "-"}
                                  </p>

                                  <p className="truncate text-xs text-gray-400">
                                    {student.department?.code ||
                                      "-"}
                                  </p>
                                </div>

                              </div>
                            </td>

                            {/* REGISTER */}
                            <td className="whitespace-nowrap px-3 py-3 font-semibold text-gray-700">
                              {student.registerNumber ||
                                "-"}
                            </td>

                            {/* SEMESTER */}
                            <td className="px-3 py-3 text-center">
                              <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                {student.semester ||
                                  "-"}
                              </span>
                            </td>

                            {/* DAILY ATTENDANCE */}
                            {classDates.map(
                              (date) => {
                                const status =
                                  getAttendanceStatus(
                                    student,
                                    date
                                  );

                                return (
                                  <td
                                    key={date}
                                    className="px-2 py-3 text-center"
                                  >
                                    {status ===
                                    "PRESENT" ? (
                                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                                        P
                                      </span>
                                    ) : status ===
                                      "ABSENT" ? (
                                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                                        A
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-300">
                                        -
                                      </span>
                                    )}
                                  </td>
                                );
                              }
                            )}

                            {/* ATTENDED */}
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-green-600">
                                {
                                  student.attendedClasses
                                }
                              </span>
                            </td>

                            {/* TOTAL */}
                            <td className="px-3 py-3 text-center font-semibold text-gray-600">
                              {
                                student.totalClasses
                              }
                            </td>

                            {/* PERCENTAGE */}
                            <td className="px-3 py-3">

                              <div className="flex items-center justify-center gap-2">

                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                                  <div
                                    className={`h-full rounded-full ${
                                      percentage >=
                                      75
                                        ? "bg-green-500"
                                        : "bg-red-400"
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        percentage,
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>

                                <span
                                  className={`text-xs font-bold ${
                                    percentage >=
                                    75
                                      ? "text-green-600"
                                      : "text-red-500"
                                  }`}
                                >
                                  {percentage}%
                                </span>

                              </div>
                            </td>

                            {/* CERTIFICATE */}
                            <td className="px-3 py-3 text-center">

                              {student.certificateAllowed ? (
                                <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
                                  ALLOWED
                                </span>
                              ) : student.certificateStatus ? (
                                <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                                  {
                                    student.certificateStatus
                                  }
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500">
                                  NOT GENERATED
                                </span>
                              )}

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* FILTERED EMPTY */}
        {!loadingAttendance &&
          students.length > 0 &&
          filteredStudents.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="text-3xl">
                🔎
              </div>

              <p className="mt-3 text-sm font-bold text-gray-700">
                No students found
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Try changing the search or semester filter.
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
  title,
  value,
  icon,
  className,
}) {
  return (
    <div
      className={`rounded-xl border border-gray-100 px-4 py-3 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold opacity-70">
          {title}
        </span>

        <span className="text-lg">
          {icon}
        </span>
      </div>

      <div className="mt-1 text-xl font-bold">
        {value}
      </div>
    </div>
  );
}