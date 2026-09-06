"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function AttendancePage() {
  const { getToken } = useAuth();

  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState("");

  const [students, setStudents] = useState([]);
  const [totalClasses, setTotalClasses] = useState(0);

  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [error, setError] = useState("");

  /* =====================================================
     LOAD CLUBS
     ===================================================== */

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
          response.data.message || "Failed to load clubs"
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

  /* =====================================================
     LOAD CONSOLIDATED ATTENDANCE
     ===================================================== */

  const loadAttendance = async () => {
    if (!selectedClub) {
      setStudents([]);
      setTotalClasses(0);
      return;
    }

    try {
      setLoadingAttendance(true);
      setError("");

      const token = await getToken();

      const response = await api.get(
        `/api/attendance/consolidated?clubId=${selectedClub}`,
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

      setStudents(response.data.students || []);
      setTotalClasses(response.data.totalClasses || 0);
    } catch (err) {
      console.error(
        "Load consolidated attendance error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load attendance"
      );

      setStudents([]);
      setTotalClasses(0);
    } finally {
      setLoadingAttendance(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
     ===================================================== */

  useEffect(() => {
    loadClubs();
  }, []);

  /* =====================================================
     LOAD WHEN CLUB CHANGES
     ===================================================== */

  useEffect(() => {
    loadAttendance();
  }, [selectedClub]);

  /* =====================================================
     SUMMARY
     ===================================================== */

  const totalStudents = students.length;

  const averageAttendance =
    totalStudents > 0
      ? Math.round(
          students.reduce(
            (sum, student) =>
              sum + (student.percentage || 0),
            0
          ) / totalStudents
        )
      : 0;

  const studentsAboveCriteria = students.filter(
    (student) => student.percentage >= 75
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Consolidated Attendance
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View overall attendance of club members.
        </p>
      </div>

      {/* =================================================
          CLUB FILTER
          ================================================= */}

      <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">

        <div className="max-w-md">

          <label className="mb-1 block text-sm font-medium text-gray-700">
            Club
          </label>

          <select
            value={selectedClub}
            onChange={(e) =>
              setSelectedClub(e.target.value)
            }
            disabled={loadingClubs}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >

            <option value="">
              Select Club
            </option>

            {clubs.map((club) => (
              <option
                key={club._id || club.id}
                value={club._id || club.id}
              >
                {club.name}
              </option>
            ))}

          </select>

        </div>

      </div>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =================================================
          SELECT CLUB MESSAGE
          ================================================= */}

      {!selectedClub && !loadingClubs && (
        <div className="rounded-xl border bg-white p-10 text-center">

          <p className="font-medium text-gray-700">
            Select a club to view consolidated attendance.
          </p>

        </div>
      )}

      {/* =================================================
          LOADING
          ================================================= */}

      {loadingAttendance && (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
          Loading attendance...
        </div>
      )}

      {/* =================================================
          SUMMARY
          ================================================= */}

      {!loadingAttendance &&
        selectedClub &&
        students.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

            {/* TOTAL CLASSES */}

            <div className="rounded-xl border bg-white p-4 shadow-sm">

              <p className="text-sm text-gray-500">
                Total Classes
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalClasses}
              </p>

            </div>

            {/* STUDENTS */}

            <div className="rounded-xl border bg-white p-4 shadow-sm">

              <p className="text-sm text-gray-500">
                Total Students
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalStudents}
              </p>

            </div>

            {/* AVERAGE */}

            <div className="rounded-xl border bg-white p-4 shadow-sm">

              <p className="text-sm text-gray-500">
                Average Attendance
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-600">
                {averageAttendance}%
              </p>

            </div>

          </div>
        )}

      {/* =================================================
          NO ATTENDANCE
          ================================================= */}

      {!loadingAttendance &&
        selectedClub &&
        students.length === 0 && (
          <div className="rounded-xl border bg-white p-10 text-center">

            <p className="font-medium text-gray-700">
              No attendance records found.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Attendance will appear here after the
              Club In-charge submits it.
            </p>

          </div>
        )}

      {/* =================================================
          DESKTOP TABLE
          ================================================= */}

      {!loadingAttendance &&
        students.length > 0 && (

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
                    Attended
                  </th>

                  <th className="px-5 py-4 text-center text-sm font-semibold text-gray-700">
                    Total Classes
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

                    {/* NUMBER */}

                    <td className="px-5 py-4 text-sm text-gray-500">
                      {index + 1}
                    </td>

                    {/* STUDENT */}

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

                    {/* REGISTER NUMBER */}

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {student.registerNumber}
                    </td>

                    {/* DEPARTMENT */}

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {student.department?.code || "-"}
                    </td>

                    {/* ATTENDED */}

                    <td className="px-5 py-4 text-center text-sm font-medium text-green-600">
                      {student.attendedClasses}
                    </td>

                    {/* TOTAL */}

                    <td className="px-5 py-4 text-center text-sm text-gray-700">
                      {student.totalClasses}
                    </td>

                    {/* PERCENTAGE */}

                    <td className="px-5 py-4 text-center">

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          student.percentage >= 75
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {student.percentage}%
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      {/* =================================================
          MOBILE CARDS
          ================================================= */}

      {!loadingAttendance &&
        students.length > 0 && (

          <div className="space-y-4 md:hidden">

            {students.map((student, index) => (

              <div
                key={student.studentId}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >

                <div className="flex items-start justify-between gap-3">

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

                    <div>

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

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      student.percentage >= 75
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {student.percentage}%
                  </span>

                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">

                  <div className="rounded-lg bg-gray-50 p-3">

                    <p className="text-xs text-gray-500">
                      Attended
                    </p>

                    <p className="mt-1 text-lg font-semibold text-green-600">
                      {student.attendedClasses}
                    </p>

                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">

                    <p className="text-xs text-gray-500">
                      Total Classes
                    </p>

                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {student.totalClasses}
                    </p>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

    </div>
  );
}