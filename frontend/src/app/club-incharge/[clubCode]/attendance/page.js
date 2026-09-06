"use client";

import { useEffect, useState } from "react";
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
  student.status || null;

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
  };

  /* =====================================================
     SUBMIT ATTENDANCE
     ===================================================== */

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

      const attendanceData = students.map((student) => ({
        studentId: student.studentId,
        status: attendance[student.studentId],
      }));

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
      console.error("Submit attendance error:", err);

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

  const presentCount = students.filter(
    (student) =>
      attendance[student.studentId] === "PRESENT"
  ).length;

  const absentCount = students.filter(
    (student) =>
      attendance[student.studentId] === "ABSENT"
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Attendance
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Mark daily attendance of confirmed club members.
        </p>
      </div>

      {/* DATE */}
      <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Attendance Date
            </label>

           <input
  type="date"
  value={attendanceDate}
  onChange={(e) => setAttendanceDate(e.target.value)}
  disabled={loading}
  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
/>
          </div>

          {submitted && (
            <div className="rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
              Attendance Submitted & Locked
            </div>
          )}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* SUMMARY */}
      {!loading && students.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Students
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {students.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Present
            </p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {presentCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Absent
            </p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {absentCount}
            </p>
          </div>

        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
          Loading students...
        </div>
      )}

      {/* NO STUDENTS */}
      {!loading && students.length === 0 && (
        <div className="rounded-xl border bg-white p-10 text-center">
          <p className="font-medium text-gray-700">
            No confirmed club members found.
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Confirmed students will appear here.
          </p>
        </div>
      )}

      {/* DESKTOP TABLE */}
      {!loading && students.length > 0 && (
        <div className="hidden overflow-hidden rounded-xl border bg-white shadow-sm md:block">

          <table className="w-full text-left">

            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold text-gray-700">
                  #
                </th>

                <th className="px-5 py-4 text-sm font-semibold text-gray-700">
                  Student
                </th>

                <th className="px-5 py-4 text-sm font-semibold text-gray-700">
                  Register Number
                </th>

                <th className="px-5 py-4 text-sm font-semibold text-gray-700">
                  Department
                </th>

                <th className="px-5 py-4 text-center text-sm font-semibold text-gray-700">
                  Attendance
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">

              {students.map((student, index) => (
                <tr
                  key={student.studentId}
                  className="hover:bg-gray-50"
                >

                  <td className="px-5 py-4 text-sm text-gray-500">
                    {index + 1}
                  </td>

                  <td className="px-5 py-4">

                    <div className="flex items-center gap-3">

                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                          {student.name?.charAt(0) || "S"}
                        </div>
                      )}

                      <div>
                        <p className="font-medium text-gray-900">
                          {student.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          {student.email}
                        </p>
                      </div>

                    </div>

                  </td>

                  <td className="px-5 py-4 text-sm text-gray-700">
                    {student.registerNumber}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-700">
                    {student.department?.code || "-"}
                  </td>

                  <td className="px-5 py-4">

                    <div className="flex justify-center gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          markAttendance(
                            student.studentId,
                            "PRESENT"
                          )
                        }
                        disabled={submitted}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${
                          attendance[student.studentId] ===
                          "PRESENT"
                            ? "bg-green-600 text-white"
                            : "border border-green-300 text-green-700 hover:bg-green-50"
                        } ${
                          submitted
                            ? "cursor-not-allowed opacity-70"
                            : ""
                        }`}
                      >
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
                        disabled={submitted}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${
                          attendance[student.studentId] ===
                          "ABSENT"
                            ? "bg-red-600 text-white"
                            : "border border-red-300 text-red-700 hover:bg-red-50"
                        } ${
                          submitted
                            ? "cursor-not-allowed opacity-70"
                            : ""
                        }`}
                      >
                        Absent
                      </button>

                    </div>

                  </td>

                </tr>
              ))}

            </tbody>
          </table>
        </div>
      )}

      {/* MOBILE CARDS */}
      {!loading && students.length > 0 && (
        <div className="space-y-4 md:hidden">

          {students.map((student, index) => (
            <div
              key={student.studentId}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >

              <div className="flex items-center gap-3">

                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-600">
                    {student.name?.charAt(0) || "S"}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {index + 1}. {student.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {student.registerNumber}
                  </p>

                  <p className="text-xs text-gray-500">
                    {student.department?.code || "-"}
                  </p>
                </div>

              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">

                <button
                  type="button"
                  onClick={() =>
                    markAttendance(
                      student.studentId,
                      "PRESENT"
                    )
                  }
                  disabled={submitted}
                  className={`rounded-lg py-2.5 text-sm font-medium ${
                    attendance[student.studentId] ===
                    "PRESENT"
                      ? "bg-green-600 text-white"
                      : "border border-green-300 text-green-700"
                  } ${
                    submitted
                      ? "cursor-not-allowed opacity-70"
                      : ""
                  }`}
                >
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
                  disabled={submitted}
                  className={`rounded-lg py-2.5 text-sm font-medium ${
                    attendance[student.studentId] ===
                    "ABSENT"
                      ? "bg-red-600 text-white"
                      : "border border-red-300 text-red-700"
                  } ${
                    submitted
                      ? "cursor-not-allowed opacity-70"
                      : ""
                  }`}
                >
                  Absent
                </button>

              </div>

            </div>
          ))}

        </div>
      )}

      {/* SUBMIT */}
      {!loading && students.length > 0 && !submitted && (
        <div className="mt-6 flex justify-end">

          <button
            type="button"
            onClick={submitAttendance}
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Submitting..."
              : "Submit Attendance"}
          </button>

        </div>
      )}

    </div>
  );
}