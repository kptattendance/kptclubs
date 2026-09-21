"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function HODStudentsPage() {
  const { getToken, isLoaded } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [clubFilter, setClubFilter] = useState("ALL");

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // =====================================================
  // LOAD DEPARTMENT STUDENTS
  // =====================================================

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await api.get(
        "/api/hod/department/students",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load students"
        );
      }

      setStudents(
        response.data.students || []
      );
    } catch (error) {
      console.error(
        "Load HOD students error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to load students"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    loadStudents();
  }, [isLoaded]);

  // =====================================================
  // SEMESTERS
  // =====================================================

  const semesters = [1, 2, 3, 4, 5, 6];

  // =====================================================
  // CLUB LIST
  // =====================================================

  const clubs = useMemo(() => {
    const clubMap = new Map();

    students.forEach((student) => {
      if (student.club?._id) {
        clubMap.set(
          String(student.club._id),
          student.club
        );
      }
    });

    return Array.from(clubMap.values()).sort(
      (a, b) =>
        (a.name || "").localeCompare(
          b.name || ""
        )
    );
  }, [students]);

  // =====================================================
  // FILTER + SORT
  // =====================================================

  const filteredStudents = useMemo(() => {
    let result = [...students];

    // SEMESTER
    if (semesterFilter !== "ALL") {
      result = result.filter(
        (student) =>
          String(student.semester) ===
          String(semesterFilter)
      );
    }

    // CLUB
    if (clubFilter !== "ALL") {
      if (clubFilter === "NO_CLUB") {
        result = result.filter(
          (student) => !student.club
        );
      } else {
        result = result.filter(
          (student) =>
            String(student.club?._id) ===
            String(clubFilter)
        );
      }
    }

    // SEARCH
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

          student.club?.name
            ?.toLowerCase()
            .includes(value) ||

          student.club?.code
            ?.toLowerCase()
            .includes(value)
        );
      });
    }

    // SORT
    result.sort((a, b) => {
      let valueA = "";
      let valueB = "";

      switch (sortBy) {
        case "name":
          valueA = a.name || "";
          valueB = b.name || "";
          break;

        case "registerNumber":
          valueA =
            a.registerNumber || "";
          valueB =
            b.registerNumber || "";
          break;

        case "semester":
          valueA = Number(
            a.semester || 0
          );
          valueB = Number(
            b.semester || 0
          );
          break;

        case "club":
          valueA =
            a.club?.name || "";
          valueB =
            b.club?.name || "";
          break;

        default:
          break;
      }

      if (
        typeof valueA === "number" &&
        typeof valueB === "number"
      ) {
        return sortOrder === "asc"
          ? valueA - valueB
          : valueB - valueA;
      }

      return sortOrder === "asc"
        ? String(valueA).localeCompare(
            String(valueB)
          )
        : String(valueB).localeCompare(
            String(valueA)
          );
    });

    return result;
  }, [
    students,
    search,
    semesterFilter,
    clubFilter,
    sortBy,
    sortOrder,
  ]);

  // =====================================================
  // LOADING
  // =====================================================

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-gray-500">
            Loading students...
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

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            Department Students
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Students from your department
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!error && (
          <>
            {/* FILTER BAR */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

                {/* FILTERS */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:flex">

                  {/* SEARCH */}
                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search student or register no."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
                  />

                  {/* SEMESTER */}
                  <select
                    value={semesterFilter}
                    onChange={(e) =>
                      setSemesterFilter(
                        e.target.value
                      )
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="ALL">
                      All Semesters
                    </option>

                    {semesters.map(
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

                  {/* CLUB */}
                  <select
                    value={clubFilter}
                    onChange={(e) =>
                      setClubFilter(
                        e.target.value
                      )
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="ALL">
                      All Clubs
                    </option>

                    <option value="NO_CLUB">
                      No Club
                    </option>

                    {clubs.map((club) => (
                      <option
                        key={club._id}
                        value={club._id}
                      >
                        {club.name}
                      </option>
                    ))}
                  </select>

                  {/* SORT */}
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value
                      )
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="name">
                      Sort: Name
                    </option>

                    <option value="registerNumber">
                      Sort: Register No.
                    </option>

                    <option value="semester">
                      Sort: Semester
                    </option>

                    <option value="club">
                      Sort: Club
                    </option>
                  </select>

                </div>

                {/* RIGHT */}
                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setSortOrder(
                        (prev) =>
                          prev === "asc"
                            ? "desc"
                            : "asc"
                      )
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    {sortOrder === "asc"
                      ? "↑ Ascending"
                      : "↓ Descending"}
                  </button>

                  <button
                    type="button"
                    onClick={loadStudents}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Refresh
                  </button>

                </div>

              </div>

            </div>

            {/* TABLE */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

              {/* COUNT */}
              <div className="border-b border-gray-200 px-4 py-3">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-gray-800">
                    {filteredStudents.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800">
                    {students.length}
                  </span>{" "}
                  students
                </p>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="px-6 py-12 text-center">

                  <p className="text-sm font-medium text-gray-700">
                    No students found.
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Try changing the filters.
                  </p>

                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[800px] text-sm">

                    {/* HEADER */}
                    <thead className="border-b border-gray-200 bg-gray-50">

                      <tr>

                        <th className="w-16 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                          S.No.
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Student
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Register No.
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Semester
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Club
                        </th>

                      </tr>

                    </thead>

                    {/* BODY */}
                    <tbody className="divide-y divide-gray-100">

                      {filteredStudents.map(
                        (student, index) => (

                          <tr
                            key={student._id}
                            className="transition hover:bg-blue-50/40"
                          >

                            {/* S.NO */}
                            <td className="px-4 py-3 text-center text-gray-500">
                              {index + 1}
                            </td>

                            {/* STUDENT */}
                            <td className="px-4 py-3">

                              <div className="flex items-center gap-3">

                                {student.profilePhoto ? (
                                  <img
                                    src={
                                      student.profilePhoto
                                    }
                                    alt={
                                      student.name ||
                                      "Student"
                                    }
                                    className="h-9 w-9 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                                    {student.name
                                      ?.charAt(
                                        0
                                      )
                                      ?.toUpperCase() ||
                                      "S"}
                                  </div>
                                )}

                                <span className="font-medium text-gray-800">
                                  {student.name ||
                                    "-"}
                                </span>

                              </div>

                            </td>

                            {/* REGISTER */}
                            <td className="px-4 py-3 font-medium text-gray-700">
                              {student.registerNumber ||
                                "-"}
                            </td>

                            {/* SEMESTER */}
                            <td className="px-4 py-3 text-center text-gray-700">
                              {student.semester ||
                                "-"}
                            </td>

                            {/* CLUB */}
                            <td className="px-4 py-3">

                              {student.club ? (
                                <span className="font-medium text-gray-700">
                                  {student.club.name}
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  No Club
                                </span>
                              )}

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

          </>
        )}

      </div>

    </div>
  );
}