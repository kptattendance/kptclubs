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
          "Failed to load clubs"
      );

    } finally {
      setLoadingClubs(false);
    }
  };

  // =====================================================
  // LOAD ATTENDANCE
  // =====================================================

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
      setTotalClasses(
        response.data.totalClasses || 0
      );

    } catch (err) {
      console.error(
        "Load attendance error:",
        err
      );

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

  // =====================================================
  // SUMMARY
  // =====================================================

  const averageAttendance =
    students.length > 0
      ? Math.round(
          students.reduce(
            (sum, student) =>
              sum +
              Number(
                student.percentage || 0
              ),
            0
          ) / students.length
        )
      : 0;

  const studentsAbove75 = students.filter(
    (student) =>
      student.percentage >= 75
  ).length;

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-5 sm:py-5">

      <div className="mx-auto w-full max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-5 sm:mb-6">

          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            Department Attendance
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Monitor club attendance of students in your department
          </p>

        </div>


        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div
          className="
            mb-5
            rounded-xl
            border
            border-gray-200
            bg-white
            p-3
            shadow-sm
            sm:p-4
          "
        >

          <div
            className="
              flex
              flex-col
              gap-4
              lg:flex-row
              lg:items-end
              lg:justify-between
            "
          >

            {/* SELECT CLUB */}

            <div className="w-full lg:max-w-sm">

              <label
                htmlFor="club"
                className="
                  mb-1.5
                  block
                  text-xs
                  font-medium
                  text-gray-500
                "
              >
                Select Club
              </label>

              <select
                id="club"
                value={selectedClub}
                onChange={(e) =>
                  setSelectedClub(
                    e.target.value
                  )
                }
                disabled={loadingClubs}
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-200
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  text-gray-700
                  shadow-sm
                  outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                  disabled:bg-gray-100
                  disabled:text-gray-400
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

            {selectedClub &&
              !loadingAttendance && (

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-2
                    sm:grid-cols-4
                    lg:flex
                    lg:items-center
                  "
                >

                  {/* CLASSES */}

                  <div
                    className="
                      rounded-lg
                      bg-gray-50
                      px-3
                      py-2
                      sm:px-4
                    "
                  >
                    <div className="text-xs text-gray-500">
                      Classes
                    </div>

                    <div className="mt-0.5 font-semibold text-gray-800">
                      {totalClasses}
                    </div>
                  </div>


                  {/* STUDENTS */}

                  <div
                    className="
                      rounded-lg
                      bg-gray-50
                      px-3
                      py-2
                      sm:px-4
                    "
                  >
                    <div className="text-xs text-gray-500">
                      Students
                    </div>

                    <div className="mt-0.5 font-semibold text-gray-800">
                      {students.length}
                    </div>
                  </div>


                  {/* AVERAGE */}

                  <div
                    className="
                      rounded-lg
                      bg-blue-50
                      px-3
                      py-2
                      sm:px-4
                    "
                  >
                    <div className="text-xs text-gray-500">
                      Average
                    </div>

                    <div className="mt-0.5 font-semibold text-blue-600">
                      {averageAttendance}%
                    </div>
                  </div>


                  {/* 75%+ */}

                  <div
                    className="
                      rounded-lg
                      bg-green-50
                      px-3
                      py-2
                      sm:px-4
                    "
                  >
                    <div className="text-xs text-gray-500">
                      75%+
                    </div>

                    <div className="mt-0.5 font-semibold text-green-600">
                      {studentsAbove75}
                    </div>
                  </div>

                </div>
              )}

          </div>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="
              mb-4
              rounded-lg
              border
              border-red-200
              bg-red-50
              px-3
              py-3
              text-xs
              text-red-600
              sm:px-4
              sm:text-sm
            "
          >
            {error}
          </div>
        )}


        {/* =================================================
            NO CLUB
        ================================================= */}

        {!selectedClub &&
          !loadingClubs && (

            <div
              className="
                rounded-xl
                bg-white
                px-4
                py-12
                text-center
                shadow-sm
                sm:py-16
              "
            >

              <div className="text-3xl sm:text-4xl">
                📊
              </div>

              <p className="mt-2 text-sm font-medium text-gray-700">
                Select a club
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Attendance details will appear here
              </p>

            </div>
          )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loadingAttendance && (

          <div
            className="
              rounded-xl
              bg-white
              px-4
              py-10
              text-center
              text-sm
              text-gray-500
              shadow-sm
            "
          >
            Loading attendance...
          </div>

        )}


        {/* =================================================
            NO DATA
        ================================================= */}

        {!loadingAttendance &&
          selectedClub &&
          students.length === 0 && (

            <div
              className="
                rounded-xl
                bg-white
                px-4
                py-10
                text-center
                shadow-sm
              "
            >

              <p className="text-sm font-medium text-gray-700">
                No attendance records
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Attendance will appear after submission
              </p>

            </div>
          )}


        {/* =================================================
            ATTENDANCE TABLE
        ================================================= */}

        {!loadingAttendance &&
          students.length > 0 && (

            <div
              className="
                overflow-hidden
                rounded-xl
                border
                border-gray-200
                bg-white
                shadow-sm
              "
            >

              {/* MOBILE HORIZONTAL SCROLL */}

              <div
                className="
                  w-full
                  overflow-x-auto
                  overscroll-x-contain
                "
              >

                <table
                  className="
                    w-full
                    min-w-[850px]
                    text-sm
                  "
                >

                  {/* TABLE HEADER */}

                  <thead>

                    <tr className="border-b border-gray-200 bg-gray-50 text-left">

                      <th className="w-12 px-3 py-3 text-xs font-semibold text-gray-500 sm:px-4">
                        #
                      </th>

                      <th className="px-3 py-3 text-xs font-semibold text-gray-500 sm:px-4">
                        STUDENT
                      </th>

                      <th className="px-3 py-3 text-xs font-semibold text-gray-500 sm:px-4">
                        REGISTER NUMBER
                      </th>

                      <th className="px-3 py-3 text-xs font-semibold text-gray-500 sm:px-4">
                        DEPARTMENT
                      </th>

                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 sm:px-4">
                        ATTENDED
                      </th>

                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 sm:px-4">
                        TOTAL
                      </th>

                      <th className="px-3 py-3 text-xs font-semibold text-gray-500 sm:px-4">
                        ATTENDANCE
                      </th>

                    </tr>

                  </thead>


                  {/* TABLE BODY */}

                  <tbody className="divide-y divide-gray-100">

                    {students.map(
                      (student, index) => {

                        const percentage =
                          Number(
                            student.percentage || 0
                          );

                        return (

                          <tr
                            key={student.studentId}
                            className="
                              transition
                              hover:bg-gray-50
                            "
                          >

                            {/* NUMBER */}

                            <td className="px-3 py-3 text-gray-400 sm:px-4">
                              {index + 1}
                            </td>


                            {/* STUDENT */}

                            <td className="px-3 py-3 sm:px-4">

                              <div className="flex items-center gap-2.5">

                                {student.photoUrl ? (

                                  <img
                                    src={student.photoUrl}
                                    alt=""
                                    className="
                                      h-9
                                      w-9
                                      shrink-0
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
                                      shrink-0
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

                                <div className="min-w-0 max-w-[220px]">

                                  <p className="truncate font-medium text-gray-800">
                                    {student.name?.toUpperCase()}
                                  </p>

                                  <p className="truncate text-xs text-gray-400">
                                    {student.email}
                                  </p>

                                </div>

                              </div>

                            </td>


                            {/* REGISTER NUMBER */}

                            <td
                              className="
                                whitespace-nowrap
                                px-3
                                py-3
                                text-gray-600
                                sm:px-4
                              "
                            >
                              {student.registerNumber}
                            </td>


                            {/* DEPARTMENT */}

                            <td className="px-3 py-3 sm:px-4">

                              <span
                                className="
                                  whitespace-nowrap
                                  rounded-md
                                  bg-gray-100
                                  px-2
                                  py-1
                                  text-xs
                                  font-medium
                                  text-gray-600
                                "
                              >
                                {student.department?.code ||
                                  "-"}
                              </span>

                            </td>


                            {/* ATTENDED */}

                            <td className="px-3 py-3 text-center sm:px-4">

                              <span className="font-semibold text-green-600">
                                {student.attendedClasses}
                              </span>

                            </td>


                            {/* TOTAL */}

                            <td
                              className="
                                px-3
                                py-3
                                text-center
                                text-gray-600
                                sm:px-4
                              "
                            >
                              {student.totalClasses}
                            </td>


                            {/* ATTENDANCE */}

                            <td className="px-3 py-3 sm:px-4">

                              <div className="flex items-center gap-3">

                                <div
                                  className="
                                    h-1.5
                                    w-20
                                    overflow-hidden
                                    rounded-full
                                    bg-gray-100
                                    sm:w-24
                                  "
                                >

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
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          )}

      </div>

    </div>
  );
}