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
  const [loadingAttendance, setLoadingAttendance] =
    useState(false);

  const [error, setError] = useState("");

  // LOAD CLUBS
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
          "Failed to load clubs"
      );
    } finally {
      setLoadingClubs(false);
    }
  };

  // LOAD ATTENDANCE
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
      console.error("Load attendance error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load attendance"
      );

      setStudents([]);
      setTotalClasses(0);
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    loadClubs();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [selectedClub]);

  // SUMMARY
  const averageAttendance =
    students.length > 0
      ? Math.round(
          students.reduce(
            (sum, student) =>
              sum + Number(student.percentage || 0),
            0
          ) / students.length
        )
      : 0;

  const studentsAbove75 = students.filter(
    (student) => student.percentage >= 75
  ).length;

  return (
    <div className="px-5 py-5">

      {/* HEADER */}
      <div className="mb-5">

        <h1 className="text-2xl font-semibold text-gray-800">
          Department Attendance
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Monitor club attendance of students in your department
        </p>

      </div>

      {/* FILTER BAR */}
      <div className="mb-5 flex flex-wrap items-center gap-3">

        <div className="w-72">

          <label className="mb-1 block text-xs font-medium text-gray-500">
            Select Club
          </label>

          <select
            value={selectedClub}
            onChange={(e) =>
              setSelectedClub(e.target.value)
            }
            disabled={loadingClubs}
            className="
              w-full
              rounded-lg
              bg-white
              px-3
              py-2
              text-sm
              text-gray-700
              shadow-sm
              outline-none
              ring-1
              ring-gray-200
              focus:ring-2
              focus:ring-blue-500
            "
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

        {/* SUMMARY */}
        {selectedClub && !loadingAttendance && (
          <div className="flex items-center gap-2 pt-5">

            <div className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-gray-100">
              <span className="text-xs text-gray-500">
                Classes
              </span>
              <span className="ml-2 font-semibold text-gray-800">
                {totalClasses}
              </span>
            </div>

            <div className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-gray-100">
              <span className="text-xs text-gray-500">
                Students
              </span>
              <span className="ml-2 font-semibold text-gray-800">
                {students.length}
              </span>
            </div>

            <div className="rounded-lg bg-blue-50 px-4 py-2">
              <span className="text-xs text-gray-500">
                Average
              </span>
              <span className="ml-2 font-semibold text-blue-600">
                {averageAttendance}%
              </span>
            </div>

            <div className="rounded-lg bg-green-50 px-4 py-2">
              <span className="text-xs text-gray-500">
                75%+
              </span>
              <span className="ml-2 font-semibold text-green-600">
                {studentsAbove75}
              </span>
            </div>

          </div>
        )}

      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* NO CLUB */}
      {!selectedClub && !loadingClubs && (
        <div className="rounded-xl bg-white py-12 text-center shadow-sm">
          <div className="text-3xl">📊</div>

          <p className="mt-2 text-sm font-medium text-gray-700">
            Select a club
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Attendance details will appear here
          </p>
        </div>
      )}

      {/* LOADING */}
      {loadingAttendance && (
        <div className="rounded-xl bg-white py-10 text-center text-sm text-gray-500 shadow-sm">
          Loading attendance...
        </div>
      )}

      {/* NO DATA */}
      {!loadingAttendance &&
        selectedClub &&
        students.length === 0 && (
          <div className="rounded-xl bg-white py-10 text-center shadow-sm">

            <p className="text-sm font-medium text-gray-700">
              No attendance records
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Attendance will appear after submission
            </p>

          </div>
        )}

      {/* ATTENDANCE TABLE */}
      {!loadingAttendance &&
        students.length > 0 && (

          <div className="overflow-hidden rounded-xl bg-white shadow-sm">

            <table className="w-full text-sm">

              <thead>

                <tr className="bg-gray-50 text-left">

                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    #
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    STUDENT
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    REGISTER NUMBER
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    DEPARTMENT
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">
                    ATTENDED
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">
                    TOTAL
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    ATTENDANCE
                  </th>

                </tr>

              </thead>

              <tbody>

                {students.map((student, index) => {

                  const percentage =
                    Number(student.percentage || 0);

                  return (
                    <tr
                      key={student.studentId}
                      className="
                        transition
                        hover:bg-gray-50
                      "
                    >

                      {/* NUMBER */}
                      <td className="px-4 py-3 text-gray-400">
                        {index + 1}
                      </td>

                      {/* STUDENT */}
                      <td className="px-4 py-3">

                        <div className="flex items-center gap-3">

                          {student.photoUrl ? (

                            <img
                              src={student.photoUrl}
                              alt=""
                              className="
                                h-9
                                w-9
                                rounded-full
                                object-cover
                                ring-2
                                ring-gray-100
                              "
                            />

                          ) : (

                            <div
                              className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-full
                                bg-blue-50
                                text-sm
                                font-semibold
                                text-blue-600
                              "
                            >
                              {student.name?.charAt(0) ||
                                "S"}
                            </div>

                          )}

                          <div>

                            <p className="font-medium text-gray-800">
                              {student.name}
                            </p>

                            <p className="text-xs text-gray-400">
                              {student.email}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* REGISTER NUMBER */}
                      <td className="px-4 py-3 text-gray-600">
                        {student.registerNumber}
                      </td>

                      {/* DEPARTMENT */}
                      <td className="px-4 py-3">

                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                          {student.department?.code ||
                            "-"}
                        </span>

                      </td>

                      {/* ATTENDED */}
                      <td className="px-4 py-3 text-center">

                        <span className="font-semibold text-green-600">
                          {student.attendedClasses}
                        </span>

                      </td>

                      {/* TOTAL */}
                      <td className="px-4 py-3 text-center text-gray-600">
                        {student.totalClasses}
                      </td>

                      {/* ATTENDANCE */}
                      <td className="px-4 py-3">

                        <div className="flex items-center gap-3">

                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">

                            <div
                              className={`h-full rounded-full ${
                                percentage >= 75
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
                            className={`min-w-[42px] text-xs font-semibold ${
                              percentage >= 75
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            {percentage}%
                          </span>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

    </div>
  );
}