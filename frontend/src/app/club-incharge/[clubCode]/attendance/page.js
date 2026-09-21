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

  // UI filters
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  /* =====================================================
     LOAD STUDENTS
     ===================================================== */

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

      /* -----------------------------------------------
         Set existing attendance
         ----------------------------------------------- */

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

  /* =====================================================
     LOAD WHEN DATE CHANGES
     ===================================================== */

  useEffect(() => {
    loadStudents();
  }, [attendanceDate]);

  /* =====================================================
     MARK ATTENDANCE
     ===================================================== */

  const markAttendance = (studentId, status) => {
    if (submitted) return;

    setAttendance((previous) => ({
      ...previous,
      [studentId]: status,
    }));

    setError("");
  };

  /* =====================================================
     MARK ALL PRESENT
     ===================================================== */

  const markAllPresent = () => {
    if (submitted || students.length === 0) return;

    const updatedAttendance = {};

    students.forEach((student) => {
      updatedAttendance[student.studentId] =
        "PRESENT";
    });

    setAttendance(updatedAttendance);
    setError("");
  };

  /* =====================================================
     CLEAR ALL
     ===================================================== */

  const clearAttendance = () => {
    if (submitted) return;

    const updatedAttendance = {};

    students.forEach((student) => {
      updatedAttendance[student.studentId] = null;
    });

    setAttendance(updatedAttendance);
    setError("");
  };

  /* =====================================================
     SUBMIT ATTENDANCE
     ===================================================== */

  const submitAttendance = async () => {
    if (submitted) return;

    if (students.length === 0) {
      setError(
        "No confirmed club members found."
      );
      return;
    }

    const missingAttendance = students.some(
      (student) =>
        !attendance[student.studentId]
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
          status:
            attendance[student.studentId],
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

  /* =====================================================
     SUMMARY
     ===================================================== */

  const totalStudents = students.length;

  const presentCount = students.filter(
    (student) =>
      attendance[student.studentId] ===
      "PRESENT"
  ).length;

  const absentCount = students.filter(
    (student) =>
      attendance[student.studentId] ===
      "ABSENT"
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

  /* =====================================================
     BRANCH OPTIONS
     ===================================================== */

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

  /* =====================================================
     FILTER STUDENTS
     ===================================================== */

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

  /* =====================================================
     CLEAR FILTERS
     ===================================================== */

  const clearFilters = () => {
    setSearch("");
    setBranchFilter("ALL");
    setStatusFilter("ALL");
  };

  /* =====================================================
     FORMAT DATE
     ===================================================== */

  const formattedDate = new Date(
    `${attendanceDate}T00:00:00`
  ).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb]">
        <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
          <div className="animate-pulse space-y-6">

            <div className="h-44 rounded-3xl bg-white" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl bg-white"
                />
              ))}
            </div>

            <div className="h-[500px] rounded-2xl bg-white" />

          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <div className="mx-auto max-w-[1500px] p-4 pb-28 sm:p-6 sm:pb-32 lg:p-8">

        {/* =================================================
            HEADER
            ================================================= */}

        <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-xl sm:p-8">

          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />

          <div className="pointer-events-none absolute -bottom-32 right-24 h-64 w-64 rounded-full bg-blue-400/10" />

          <div className="relative">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="mb-3 flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 6h8M8 10h8M8 14h5M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"
                      />
                    </svg>
                  </div>

                  <span className="text-sm font-medium text-blue-200">
                    Club Attendance
                  </span>

                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Daily Attendance
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                  Mark and submit attendance for
                  confirmed club members.
                </p>

              </div>

              {/* Date */}

              <div className="w-full lg:w-[330px]">

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Attendance Date
                </label>

                <div className="relative">

                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) =>
                      setAttendanceDate(
                        e.target.value
                      )
                    }
                    disabled={loading || submitting}
                    className="h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white outline-none backdrop-blur-md transition focus:border-white/40 focus:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

                <p className="mt-2 text-xs text-slate-400">
                  {formattedDate}
                </p>

              </div>

            </div>

            {/* Locked banner */}

            {submitted && (
              <div className="relative mt-6 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/20">

                  <svg
                    className="h-4 w-4 text-emerald-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12l4 4L19 6"
                    />
                  </svg>

                </div>

                <div>
                  <p className="text-sm font-semibold text-emerald-200">
                    Attendance submitted and locked
                  </p>

                  <p className="text-xs text-slate-400">
                    Attendance for this date can no longer be changed.
                  </p>
                </div>

              </div>
            )}

          </div>
        </section>

        {/* =================================================
            ALERTS
            ================================================= */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3m0 4h.01M10.29 3.86l-7.1 12.28A2 2 0 004.92 19h14.16a2 2 0 001.73-2.86l-7.1-12.28a2 2 0 00-3.46 0z"
                />
              </svg>
            </div>

            <div>
              <p className="font-semibold">
                Attendance Error
              </p>

              <p className="mt-0.5 text-sm">
                {error}
              </p>
            </div>

          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12l4 4L19 6"
                />
              </svg>
            </div>

            <div>
              <p className="font-semibold">
                Attendance Submitted
              </p>

              <p className="mt-0.5 text-sm">
                {success}
              </p>
            </div>

          </div>
        )}

        {/* =================================================
            NO STUDENTS
            ================================================= */}

        {!loading && students.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-16 text-center">

              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50">

                <svg
                  className="h-11 w-11 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                  />
                </svg>

              </div>

              <h2 className="text-xl font-bold text-slate-900">
                No confirmed club members
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Confirmed students will appear here
                when attendance is available for
                the selected date.
              </p>

            </div>

          </div>
        )}

        {/* =================================================
            ATTENDANCE CONTENT
            ================================================= */}

        {!loading && students.length > 0 && (
          <>

            {/* =================================================
                SUMMARY
                ================================================= */}

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {/* Total */}

              <StatCard
                label="Total Students"
                value={totalStudents}
                description="Confirmed members"
                type="blue"
                icon="users"
              />

              {/* Present */}

              <StatCard
                label="Present"
                value={presentCount}
                description={
                  totalStudents > 0
                    ? `${Math.round(
                        (presentCount /
                          totalStudents) *
                          100
                      )}% of students`
                    : "0%"
                }
                type="green"
                icon="check"
              />

              {/* Absent */}

              <StatCard
                label="Absent"
                value={absentCount}
                description={
                  totalStudents > 0
                    ? `${Math.round(
                        (absentCount /
                          totalStudents) *
                          100
                      )}% of students`
                    : "0%"
                }
                type="red"
                icon="close"
              />

              {/* Remaining */}

              <StatCard
                label="Remaining"
                value={unmarkedCount}
                description={
                  unmarkedCount === 0
                    ? "Attendance complete"
                    : "Need to mark"
                }
                type={
                  unmarkedCount === 0
                    ? "green"
                    : "amber"
                }
                icon={
                  unmarkedCount === 0
                    ? "check"
                    : "clock"
                }
              />

            </div>

            {/* =================================================
                PROGRESS
                ================================================= */}

            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="font-bold text-slate-900">
                    Attendance Progress
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {unmarkedCount === 0
                      ? "All students have been marked."
                      : `${unmarkedCount} student${
                          unmarkedCount !== 1
                            ? "s"
                            : ""
                        } still need attendance.`}
                  </p>
                </div>

                <span className="text-xl font-bold text-blue-600">
                  {completionPercentage}%
                </span>

              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completionPercentage === 100
                      ? "bg-emerald-500"
                      : "bg-blue-600"
                  }`}
                  style={{
                    width: `${completionPercentage}%`,
                  }}
                />

              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">

                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Present {presentCount}
                </span>

                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Absent {absentCount}
                </span>

                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  Unmarked {unmarkedCount}
                </span>

              </div>

            </section>

            {/* =================================================
                ACTION TOOLBAR
                ================================================= */}

            {!submitted && (
              <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Quick Actions
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Use these actions to speed up
                      attendance marking.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex">

                    <button
                      type="button"
                      onClick={markAllPresent}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 12l4 4L19 6"
                        />
                      </svg>

                      Mark All Present
                    </button>

                    <button
                      type="button"
                      onClick={clearAttendance}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Clear All
                    </button>

                  </div>

                </div>

              </section>
            )}

            {/* =================================================
                STUDENT LIST
                ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* Heading */}

              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-bold text-slate-900">
                    Student Attendance
                  </h2>

                  <p className="text-sm text-slate-500">
                    {filteredStudents.length} of{" "}
                    {students.length} students
                  </p>
                </div>

              </div>

              {/* =================================================
                  FILTERS
                  ================================================= */}

              <div className="border-b border-slate-200 bg-slate-50/50 p-4 sm:p-5">

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_190px_190px_auto]">

                  {/* Search */}

                  <div className="relative">

                    <svg
                      className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="7"
                      />
                      <path
                        strokeLinecap="round"
                        d="M20 20l-4-4"
                      />
                    </svg>

                    <input
                      type="text"
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search student or register number..."
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />

                  </div>

                  {/* Branch */}

                  <select
                    value={branchFilter}
                    onChange={(e) =>
                      setBranchFilter(
                        e.target.value
                      )
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="ALL">
                      All Branches
                    </option>

                    {branchOptions.map(
                      (branch) => (
                        <option
                          key={branch}
                          value={branch}
                        >
                          {branch}
                        </option>
                      )
                    )}
                  </select>

                  {/* Status */}

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value
                      )
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
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

                  {/* Clear */}

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Clear
                  </button>

                </div>

              </div>

              {/* =================================================
                  NO FILTER RESULTS
                  ================================================= */}

              {filteredStudents.length === 0 && (
                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">

                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">

                    <svg
                      className="h-7 w-7 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="7"
                      />
                      <path
                        strokeLinecap="round"
                        d="M20 20l-4-4"
                      />
                    </svg>

                  </div>

                  <h3 className="font-semibold text-slate-800">
                    No students found
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Try changing the search or
                    filters.
                  </p>

                </div>
              )}

              {/* =================================================
                  DESKTOP TABLE
                  ================================================= */}

              {filteredStudents.length > 0 && (
                <div className="hidden overflow-x-auto lg:block">

                  <table className="w-full min-w-[900px]">

                    <thead className="bg-slate-50">

                      <tr className="border-b border-slate-200">

                        <th className="w-16 px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Sl. No.
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Student
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Register No.
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Branch
                        </th>

                        <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                          Attendance
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {filteredStudents.map(
                        (student, index) => {

                          const currentStatus =
                            attendance[
                              student.studentId
                            ];

                          return (
                            <tr
                              key={
                                student.studentId
                              }
                              className={`transition ${
                                currentStatus ===
                                "PRESENT"
                                  ? "bg-emerald-50/30"
                                  : currentStatus ===
                                    "ABSENT"
                                  ? "bg-red-50/30"
                                  : "hover:bg-slate-50"
                              }`}
                            >

                              {/* Sl No */}

                              <td className="px-5 py-5 text-sm font-semibold text-slate-400">
                                {index + 1}
                              </td>

                              {/* Student */}

                              <td className="px-5 py-5">

                                <div className="flex items-center gap-3">

                                  {student.photoUrl ? (
                                    <img
                                      src={
                                        student.photoUrl
                                      }
                                      alt=""
                                      className="h-11 w-11 rounded-xl object-cover shadow-sm"
                                    />
                                  ) : (
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                                      {student.name
                                        ?.charAt(
                                          0
                                        )
                                        ?.toUpperCase() ||
                                        "S"}
                                    </div>
                                  )}

                                  <div className="min-w-0">

                                    <p className="font-semibold text-slate-900">
                                      {student.name}
                                    </p>

                                    <p className="mt-0.5 max-w-[250px] truncate text-xs text-slate-500">
                                      {student.email ||
                                        "-"}
                                    </p>

                                  </div>

                                </div>

                              </td>

                              {/* Register */}

                              <td className="px-5 py-5">

                                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-700">
                                  {student.registerNumber ||
                                    "-"}
                                </span>

                              </td>

                              {/* Branch */}

                              <td className="px-5 py-5">

                                <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
                                  {student.department
                                    ?.code ||
                                    "-"}
                                </span>

                              </td>

                              {/* Attendance */}

                              <td className="px-5 py-5">

                                <div className="flex items-center justify-center gap-2">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      markAttendance(
                                        student.studentId,
                                        "PRESENT"
                                      )
                                    }
                                    disabled={
                                      submitted
                                    }
                                    className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition ${
                                      currentStatus ===
                                      "PRESENT"
                                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                                        : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                                    } ${
                                      submitted
                                        ? "cursor-not-allowed opacity-70"
                                        : ""
                                    }`}
                                  >

                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 12l4 4L19 6"
                                      />
                                    </svg>

                                    Present

                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      markAttendance(
                                        student.studentId,
                                        "ABSENT"
                                      )
                                    }
                                    disabled={
                                      submitted
                                    }
                                    className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition ${
                                      currentStatus ===
                                      "ABSENT"
                                        ? "bg-red-600 text-white shadow-sm shadow-red-200"
                                        : "border border-red-200 bg-white text-red-700 hover:bg-red-50"
                                    } ${
                                      submitted
                                        ? "cursor-not-allowed opacity-70"
                                        : ""
                                    }`}
                                  >

                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        d="M6 6l12 12M18 6L6 18"
                                      />
                                    </svg>

                                    Absent

                                  </button>

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
                  MOBILE CARDS
                  ================================================= */}

              {filteredStudents.length > 0 && (
                <div className="space-y-3 p-4 lg:hidden">

                  {filteredStudents.map(
                    (student, index) => {

                      const currentStatus =
                        attendance[
                          student.studentId
                        ];

                      return (
                        <div
                          key={
                            student.studentId
                          }
                          className={`rounded-2xl border p-4 transition ${
                            currentStatus ===
                            "PRESENT"
                              ? "border-emerald-200 bg-emerald-50/40"
                              : currentStatus ===
                                "ABSENT"
                              ? "border-red-200 bg-red-50/40"
                              : "border-slate-200 bg-white"
                          }`}
                        >

                          {/* Student header */}

                          <div className="flex items-start gap-3">

                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                              {index + 1}
                            </div>

                            {student.photoUrl ? (
                              <img
                                src={
                                  student.photoUrl
                                }
                                alt=""
                                className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm"
                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white">
                                {student.name
                                  ?.charAt(
                                    0
                                  )
                                  ?.toUpperCase() ||
                                  "S"}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">

                              <p className="truncate font-bold text-slate-900">
                                {student.name}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {student.registerNumber ||
                                  "-"}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-1.5">

                                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                  {student.department
                                    ?.code ||
                                    "-"}
                                </span>

                                {currentStatus && (
                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                      currentStatus ===
                                      "PRESENT"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {currentStatus ===
                                    "PRESENT"
                                      ? "PRESENT"
                                      : "ABSENT"}
                                  </span>
                                )}

                              </div>

                            </div>

                          </div>

                          {/* Attendance buttons */}

                          <div className="mt-4 grid grid-cols-2 gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                markAttendance(
                                  student.studentId,
                                  "PRESENT"
                                )
                              }
                              disabled={
                                submitted
                              }
                              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
                                currentStatus ===
                                "PRESENT"
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                              } ${
                                submitted
                                  ? "cursor-not-allowed opacity-70"
                                  : ""
                              }`}
                            >

                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 12l4 4L19 6"
                                />
                              </svg>

                              Present

                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                markAttendance(
                                  student.studentId,
                                  "ABSENT"
                                )
                              }
                              disabled={
                                submitted
                              }
                              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
                                currentStatus ===
                                "ABSENT"
                                  ? "bg-red-600 text-white shadow-sm"
                                  : "border border-red-200 bg-white text-red-700 hover:bg-red-50"
                              } ${
                                submitted
                                  ? "cursor-not-allowed opacity-70"
                                  : ""
                              }`}
                            >

                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  d="M6 6l12 12M18 6L6 18"
                                />
                              </svg>

                              Absent

                            </button>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>

            {/* =================================================
                DESKTOP SUBMIT
                ================================================= */}

            {!submitted && (
              <div className="mt-6 hidden justify-end lg:flex">

                <button
                  type="button"
                  onClick={submitAttendance}
                  disabled={
                    submitting ||
                    unmarkedCount > 0
                  }
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {submitting ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>

                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 12l4 4L19 6"
                        />
                      </svg>

                      Submit Attendance
                    </>
                  )}

                </button>

              </div>
            )}

          </>
        )}

      </div>

      {/* =====================================================
          MOBILE FIXED SUBMIT BAR
          ===================================================== */}

      {!loading &&
        students.length > 0 &&
        !submitted && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md lg:hidden">

            <div className="mx-auto max-w-[1500px]">

              <div className="mb-2 flex items-center justify-between px-1">

                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Attendance
                  </p>

                  <p className="text-[11px] text-slate-500">
                    {unmarkedCount === 0
                      ? "Ready to submit"
                      : `${unmarkedCount} remaining`}
                  </p>
                </div>

                <span
                  className={`text-sm font-bold ${
                    unmarkedCount === 0
                      ? "text-emerald-600"
                      : "text-blue-600"
                  }`}
                >
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
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {submitting ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>

                    Submitting...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12l4 4L19 6"
                      />
                    </svg>

                    Submit Attendance
                  </>
                )}

              </button>

            </div>

          </div>
        )}

    </main>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  label,
  value,
  description,
  type,
  icon,
}) {
  const styles = {
    blue: {
      box: "bg-blue-50",
      icon: "text-blue-600",
      value: "text-blue-700",
    },
    green: {
      box: "bg-emerald-50",
      icon: "text-emerald-600",
      value: "text-emerald-700",
    },
    red: {
      box: "bg-red-50",
      icon: "text-red-600",
      value: "text-red-700",
    },
    amber: {
      box: "bg-amber-50",
      icon: "text-amber-600",
      value: "text-amber-700",
    },
  };

  const style = styles[type];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p
            className={`mt-2 text-3xl font-bold tracking-tight ${style.value}`}
          >
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>

        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.box} ${style.icon}`}
        >

          {icon === "users" && (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
              />
            </svg>
          )}

          {icon === "check" && (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12l4 4L19 6"
              />
            </svg>
          )}

          {icon === "close" && (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          )}

          {icon === "clock" && (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
              />

              <path
                strokeLinecap="round"
                d="M12 7v5l3 2"
              />
            </svg>
          )}

        </div>

      </div>

    </div>
  );
}