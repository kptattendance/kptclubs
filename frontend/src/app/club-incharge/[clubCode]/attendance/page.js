"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function AttendancePage() {
  const { getToken } = useAuth();

  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // =====================================================
  // LOAD STUDENTS
  // =====================================================

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      const response = await api.get(
        `/api/club-incharge/attendance/members?attendanceDate=${attendanceDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      if (!data.success) {
        throw new Error(
          data.message || "Failed to load students"
        );
      }

      setStudents(data.students || []);
      setSubmitted(data.submitted || false);

      const attendanceMap = {};

      (data.students || []).forEach((student) => {
        attendanceMap[student.studentId] =
          student.status || "PRESENT";
      });

      setAttendance(attendanceMap);
    } catch (err) {
      console.error("Load attendance error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load attendance"
      );

      setStudents([]);
      setAttendance({});
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD WHEN DATE CHANGES
  // =====================================================

  useEffect(() => {
    loadStudents();
  }, [attendanceDate]);

  // =====================================================
  // MARK ATTENDANCE
  // =====================================================

  const markAttendance = (studentId, status) => {
    if (submitted) return;

    setAttendance((previous) => ({
      ...previous,
      [studentId]: status,
    }));

    setError("");
  };

  // =====================================================
  // MARK ALL PRESENT
  // =====================================================

  const markAllPresent = () => {
    if (submitted || students.length === 0) return;

    const updatedAttendance = {};

    students.forEach((student) => {
      updatedAttendance[student.studentId] = "PRESENT";
    });

    setAttendance(updatedAttendance);
    setError("");
  };

  // =====================================================
  // CLEAR ALL
  // =====================================================

  const clearAttendance = () => {
    if (submitted) return;

    const updatedAttendance = {};

    students.forEach((student) => {
      updatedAttendance[student.studentId] = null;
    });

    setAttendance(updatedAttendance);
    setError("");
  };

  // =====================================================
  // SUBMIT ATTENDANCE
  // =====================================================

  const submitAttendance = async () => {
    if (submitted) return;

    if (students.length === 0) {
      setError("No confirmed club members found.");
      return;
    }

    const missingAttendance = students.some(
      (student) => !attendance[student.studentId]
    );

    if (missingAttendance) {
      setError(
        "Please mark attendance for every student."
      );
      return;
    }

    const confirmed = window.confirm(
      `Submit attendance for ${attendanceDate}?\n\nOnce submitted, attendance cannot be changed.`
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      const attendanceData = students.map(
        (student) => ({
          studentId: student.studentId,
          status: attendance[student.studentId],
        })
      );

      const response = await api.post(
        "/api/club-incharge/attendance",
        {
          attendanceDate,
          attendance: attendanceData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
            "Failed to submit attendance"
        );
      }

      setSubmitted(true);

      setSuccess(
        "Attendance submitted successfully and is now locked."
      );
    } catch (err) {
      console.error(
        "Submit attendance error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit attendance"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalStudents = students.length;

  const presentCount = students.filter(
    (student) =>
      attendance[student.studentId] === "PRESENT"
  ).length;

  const absentCount = students.filter(
    (student) =>
      attendance[student.studentId] === "ABSENT"
  ).length;

  const unmarkedCount =
    totalStudents -
    presentCount -
    absentCount;

  const completionPercentage =
    totalStudents > 0
      ? Math.round(
          ((presentCount + absentCount) /
            totalStudents) *
            100
        )
      : 0;

  // =====================================================
  // BRANCH OPTIONS
  // =====================================================

  const branchOptions = useMemo(() => {
    const branches = students
      .map(
        (student) =>
          student.department?.code ||
          student.department?.name
      )
      .filter(Boolean);

    return [...new Set(branches)].sort();
  }, [students]);

  // =====================================================
  // FILTER STUDENTS
  // =====================================================

  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (search.trim()) {
      const query = search
        .toLowerCase()
        .trim();

      result = result.filter((student) => {
        const name =
          student.name?.toLowerCase() || "";

        const registerNumber =
          student.registerNumber
            ?.toLowerCase() || "";

        const email =
          student.email?.toLowerCase() || "";

        return (
          name.includes(query) ||
          registerNumber.includes(query) ||
          email.includes(query)
        );
      });
    }

    if (branchFilter !== "ALL") {
      result = result.filter((student) => {
        const branch =
          student.department?.code ||
          student.department?.name;

        return branch === branchFilter;
      });
    }

    if (statusFilter === "PRESENT") {
      result = result.filter(
        (student) =>
          attendance[student.studentId] ===
          "PRESENT"
      );
    }

    if (statusFilter === "ABSENT") {
      result = result.filter(
        (student) =>
          attendance[student.studentId] ===
          "ABSENT"
      );
    }

    if (statusFilter === "UNMARKED") {
      result = result.filter(
        (student) =>
          !attendance[student.studentId]
      );
    }

    return result;
  }, [
    students,
    search,
    branchFilter,
    statusFilter,
    attendance,
  ]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setBranchFilter("ALL");
    setStatusFilter("ALL");
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formattedDate = new Date(
    `${attendanceDate}T00:00:00`
  ).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl p-4 sm:p-6">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
              Loading attendance...
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-gray-50">

      <div className="mx-auto w-full max-w-7xl px-3 py-4 pb-24 sm:px-6 sm:py-6 lg:px-8 lg:pb-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">

              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Daily Attendance
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Mark attendance for confirmed club members.
              </p>

              <p className="mt-1 text-xs font-medium text-blue-600">
                {formattedDate}
              </p>

            </div>

            {/* DATE */}

            <div className="w-full sm:w-auto">

              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                Attendance Date
              </label>

              <input
                type="date"
                value={attendanceDate}
                onChange={(e) =>
                  setAttendanceDate(e.target.value)
                }
                disabled={submitting}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-52"
              />

            </div>

          </div>


          {/* LOCKED */}

          {submitted && (
            <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              Attendance submitted and locked.
            </div>
          )}

        </div>


        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}


        {/* =================================================
            NO STUDENTS
        ================================================= */}

        {students.length === 0 ? (

          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">

            <h2 className="text-lg font-semibold text-gray-800">
              No confirmed club members
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              No students are available for attendance.
            </p>

          </div>

        ) : (

          <>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

              <SummaryBox
                title="Total"
                value={totalStudents}
                text="text-gray-800"
              />

              <SummaryBox
                title="Present"
                value={presentCount}
                text="text-green-600"
              />

              <SummaryBox
                title="Absent"
                value={absentCount}
                text="text-red-600"
              />

              <SummaryBox
                title="Unmarked"
                value={unmarkedCount}
                text="text-orange-600"
              />

            </div>


            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            {!submitted && (
              <div className="mb-5 flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Quick Actions
                  </p>

                  <p className="text-xs text-gray-500">
                    Mark attendance quickly.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex">

                  <button
                    type="button"
                    onClick={markAllPresent}
                    className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Mark All Present
                  </button>

                  <button
                    type="button"
                    onClick={clearAttendance}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Clear All
                  </button>

                </div>

              </div>
            )}


            {/* =================================================
                PROGRESS
            ================================================= */}

            <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-5">

              <div className="mb-2 flex items-center justify-between">

                <span className="text-sm font-semibold text-gray-700">
                  Attendance Marked
                </span>

                <span className="text-sm font-bold text-blue-600">
                  {completionPercentage}%
                </span>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-gray-100">

                <div
                  className={`h-full rounded-full transition-all ${
                    completionPercentage === 100
                      ? "bg-green-500"
                      : "bg-blue-600"
                  }`}
                  style={{
                    width: `${completionPercentage}%`,
                  }}
                />

              </div>

            </div>


            {/* =================================================
                STUDENTS
            ================================================= */}

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">

              {/* HEADER */}

              <div className="border-b border-gray-200 p-4 sm:p-5">

                <div className="flex flex-col gap-1">

                  <h2 className="text-lg font-bold text-gray-900">
                    Student Attendance
                  </h2>

                  <p className="text-xs text-gray-500">
                    Showing {filteredStudents.length} of{" "}
                    {students.length} students
                  </p>

                </div>

              </div>


              {/* =================================================
                  FILTERS
              ================================================= */}

              <div className="border-b border-gray-200 bg-gray-50 p-3 sm:p-4">

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search student..."
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <select
                    value={branchFilter}
                    onChange={(e) =>
                      setBranchFilter(e.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500"
                  >
                    <option value="ALL">
                      All Branches
                    </option>

                    {branchOptions.map((branch) => (
                      <option
                        key={branch}
                        value={branch}
                      >
                        {branch}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500"
                  >
                    <option value="ALL">
                      All Students
                    </option>

                    <option value="UNMARKED">
                      Not Marked
                    </option>

                    <option value="PRESENT">
                      Present
                    </option>

                    <option value="ABSENT">
                      Absent
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>

                </div>

              </div>


              {/* =================================================
                  NO FILTER RESULTS
              ================================================= */}

              {filteredStudents.length === 0 && (
                <div className="p-10 text-center">

                  <p className="text-sm font-semibold text-gray-700">
                    No students found
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Try changing the search or filters.
                  </p>

                </div>
              )}


              {/* =================================================
                  DESKTOP TABLE
              ================================================= */}

              {filteredStudents.length > 0 && (

                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full">

                    <thead className="bg-gray-50">

                      <tr className="border-b border-gray-200">

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                          #
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                          Student
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                          Register No.
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                          Branch
                        </th>

                        <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-gray-500">
                          Attendance
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {filteredStudents.map(
                        (student, index) => {

                          const currentStatus =
                            attendance[
                              student.studentId
                            ];

                          return (
                            <tr
                              key={student.studentId}
                              className="hover:bg-gray-50"
                            >

                              <td className="px-5 py-4 text-sm text-gray-400">
                                {index + 1}
                              </td>

                              <td className="px-5 py-4">

                                <div className="flex items-center gap-3">

                                  <StudentPhoto
                                    student={student}
                                  />

                                  <div className="min-w-0">

                                    <p className="font-semibold text-gray-900">
                                      {student.name}
                                    </p>

                                    <p className="max-w-xs truncate text-xs text-gray-500">
                                      {student.email || "-"}
                                    </p>

                                  </div>

                                </div>

                              </td>

                              <td className="px-5 py-4 text-sm text-gray-700">
                                {student.registerNumber || "-"}
                              </td>

                              <td className="px-5 py-4">

                                <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                                  {student.department?.code ||
                                    "-"}
                                </span>

                              </td>

                              <td className="px-5 py-4">

                                <div className="flex justify-center gap-2">

                                  <AttendanceButton
                                    active={
                                      currentStatus ===
                                      "PRESENT"
                                    }
                                    type="present"
                                    disabled={submitted}
                                    onClick={() =>
                                      markAttendance(
                                        student.studentId,
                                        "PRESENT"
                                      )
                                    }
                                  />

                                  <AttendanceButton
                                    active={
                                      currentStatus ===
                                      "ABSENT"
                                    }
                                    type="absent"
                                    disabled={submitted}
                                    onClick={() =>
                                      markAttendance(
                                        student.studentId,
                                        "ABSENT"
                                      )
                                    }
                                  />

                                </div>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>
              )}


              {/* =================================================
                  MOBILE LIST
              ================================================= */}

              {filteredStudents.length > 0 && (

                <div className="divide-y divide-gray-100 md:hidden">

                  {filteredStudents.map(
                    (student, index) => {

                      const currentStatus =
                        attendance[
                          student.studentId
                        ];

                      return (
                        <div
                          key={student.studentId}
                          className="p-4"
                        >

                          <div className="flex items-center gap-3">

                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                              {index + 1}
                            </span>

                            <StudentPhoto
                              student={student}
                            />

                            <div className="min-w-0 flex-1">

                              <p className="truncate text-sm font-semibold text-gray-900">
                                {student.name}
                              </p>

                              <p className="truncate text-xs text-gray-500">
                                {student.registerNumber}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-1">

                                <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                  {student.department?.code ||
                                    "-"}
                                </span>

                                {currentStatus && (
                                  <span
                                    className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                                      currentStatus ===
                                      "PRESENT"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {currentStatus}
                                  </span>
                                )}

                              </div>

                            </div>

                          </div>


                          {/* MOBILE BUTTONS */}

                          <div className="mt-3 grid grid-cols-2 gap-2">

                            <AttendanceButton
                              active={
                                currentStatus ===
                                "PRESENT"
                              }
                              type="present"
                              disabled={submitted}
                              onClick={() =>
                                markAttendance(
                                  student.studentId,
                                  "PRESENT"
                                )
                              }
                              mobile
                            />

                            <AttendanceButton
                              active={
                                currentStatus ===
                                "ABSENT"
                              }
                              type="absent"
                              disabled={submitted}
                              onClick={() =>
                                markAttendance(
                                  student.studentId,
                                  "ABSENT"
                                )
                              }
                              mobile
                            />

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>

          </>
        )}

      </div>


      {/* =================================================
          MOBILE SUBMIT BAR
      ================================================= */}

      {!loading &&
        students.length > 0 &&
        !submitted && (

          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-3 shadow-lg md:hidden">

            <div className="mx-auto max-w-7xl">

              <div className="mb-2 flex items-center justify-between">

                <span className="text-xs text-gray-500">
                  {unmarkedCount === 0
                    ? "All attendance marked"
                    : `${unmarkedCount} remaining`}
                </span>

                <span className="text-sm font-bold text-blue-600">
                  {completionPercentage}%
                </span>

              </div>

              <button
                type="button"
                onClick={submitAttendance}
                disabled={
                  submitting ||
                  unmarkedCount > 0
                }
                className="h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Attendance"}
              </button>

            </div>

          </div>
        )}

    </main>
  );
}


// =====================================================
// SUMMARY BOX
// =====================================================

function SummaryBox({
  title,
  value,
  text,
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">

      <p className="text-xs font-medium text-gray-500">
        {title}
      </p>

      <p
        className={`mt-1 text-2xl font-bold ${text}`}
      >
        {value}
      </p>

    </div>
  );
}


// =====================================================
// ATTENDANCE BUTTON
// =====================================================

function AttendanceButton({
  active,
  type,
  disabled,
  onClick,
  mobile = false,
}) {
  const isPresent = type === "present";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${
          mobile
            ? "h-10 w-full"
            : "h-9 px-4"
        }
        rounded-lg
        text-sm
        font-semibold
        transition
        ${
          active
            ? isPresent
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
            : isPresent
            ? "border border-green-200 bg-white text-green-700 hover:bg-green-50"
            : "border border-red-200 bg-white text-red-700 hover:bg-red-50"
        }
        ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : ""
        }
      `}
    >
      {isPresent ? "Present" : "Absent"}
    </button>
  );
}


// =====================================================
// STUDENT PHOTO
// =====================================================

function StudentPhoto({ student }) {
  if (student.photoUrl) {
    return (
      <img
        src={student.photoUrl}
        alt={student.name || "Student"}
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
      {student.name
        ?.charAt(0)
        ?.toUpperCase() || "S"}
    </div>
  );
}