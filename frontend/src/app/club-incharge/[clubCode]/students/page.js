"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function ClubStudentsPage() {

  const { clubCode } = useParams();

  const { getToken, isLoaded } = useAuth();

  const [students, setStudents] = useState([]);
  const [club, setClub] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");


  // ==================================================
  // LOAD STUDENTS
  // ==================================================

  useEffect(() => {

    if (!isLoaded || !clubCode) return;

    loadStudents();

  }, [isLoaded, clubCode]);


  const loadStudents = async () => {

    try {

      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await api.get(
        `/api/club-incharge/${clubCode}/students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStudents(
        response.data.students || []
      );

      setClub(
        response.data.club || null
      );

    } catch (error) {

      console.error(
        "Club students error:",
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


  // ==================================================
  // SEARCH + SORT
  // ==================================================

  const filteredStudents = useMemo(() => {

    let result = [...students];

    const searchText =
      search.trim().toLowerCase();

    if (searchText) {

      result = result.filter((student) => {

        const name =
          student.name?.toLowerCase() || "";

        const registerNumber =
          student.registerNumber?.toLowerCase() || "";

        const department =
          student.department?.name?.toLowerCase() || "";

        const departmentCode =
          student.department?.code?.toLowerCase() || "";

        return (
          name.includes(searchText) ||
          registerNumber.includes(searchText) ||
          department.includes(searchText) ||
          departmentCode.includes(searchText)
        );

      });

    }


    result.sort((a, b) => {

      if (sortBy === "name") {

        return (a.name || "")
          .localeCompare(b.name || "");

      }

      if (sortBy === "registerNumber") {

        return (a.registerNumber || "")
          .localeCompare(
            b.registerNumber || ""
          );

      }

      if (sortBy === "department") {

        return (
          a.department?.name || ""
        ).localeCompare(
          b.department?.name || ""
        );

      }

      return 0;

    });

    return result;

  }, [students, search, sortBy]);


  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {

    return (
      <div className="flex min-h-[50vh] items-center justify-center">

        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

      </div>
    );

  }


  // ==================================================
  // ERROR
  // ==================================================

  if (error) {

    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">

        <div className="text-4xl">
          ⚠️
        </div>

        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Unable to load students
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>

        <button
          onClick={loadStudents}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Try Again
        </button>

      </div>
    );

  }


  // ==================================================
  // PAGE
  // ==================================================

  return (

    <div className="mx-auto max-w-7xl">

      {/* ==============================================
          HEADER
      ============================================== */}

      <div className="mb-7">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <h1 className="text-3xl font-bold text-gray-900">
              Students
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {club?.name ||
                `${clubCode?.toUpperCase()} Club`}
              {" "}members
            </p>

          </div>

          <div className="text-sm text-gray-500">

            <span className="font-semibold text-gray-900">
              {students.length}
            </span>

            {" "}students

          </div>

        </div>

      </div>


      {/* ==============================================
          SEARCH + SORT
      ============================================== */}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">

        {/* SEARCH */}

        <div className="relative flex-1">

          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search by name, register number or department"
            className="w-full rounded-xl bg-white py-3 pl-10 pr-4 text-sm outline-none ring-1 ring-gray-200 transition focus:ring-2 focus:ring-blue-500"
          />

        </div>


        {/* SORT */}

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value)
          }
          className="rounded-xl bg-white px-4 py-3 text-sm text-gray-700 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500"
        >

          <option value="name">
            Sort by Name
          </option>

          <option value="registerNumber">
            Sort by Register Number
          </option>

          <option value="department">
            Sort by Department
          </option>

        </select>

      </div>


      {/* ==============================================
          STUDENT TABLE
      ============================================== */}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">

        {/* DESKTOP */}

        <div className="hidden md:block">

          <table className="w-full">

            <thead>

              <tr className="bg-gray-50 text-left">

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Student
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Register Number
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Department
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Semester
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-100">

              {filteredStudents.length === 0 ? (

                <tr>

                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center"
                  >

                    <p className="text-sm font-medium text-gray-700">
                      No students found
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Try changing your search.
                    </p>

                  </td>

                </tr>

              ) : (

                filteredStudents.map((student) => (

                  <tr
                    key={student.id}
                    className="transition hover:bg-gray-50"
                  >

                    {/* STUDENT */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <StudentPhoto
                          student={student}
                        />

                        <div>

                          <p className="font-semibold text-gray-900">
                            {student.name}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            {student.email}
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* REGISTER NUMBER */}

                    <td className="px-6 py-4">

                      <span className="text-sm font-medium text-gray-700">
                        {student.registerNumber}
                      </span>

                    </td>


                    {/* DEPARTMENT */}

                    <td className="px-6 py-4">

                      <div>

                        <p className="text-sm font-medium text-gray-800">
                          {student.department?.name ||
                            "—"}
                        </p>

                        {student.department?.code && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {student.department.code}
                          </p>
                        )}

                      </div>

                    </td>


                    {/* SEMESTER */}

                    <td className="px-6 py-4">

                      <span className="text-sm text-gray-700">
                        Semester {student.semester}
                      </span>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>


        {/* ============================================
            MOBILE
        ============================================ */}

        <div className="divide-y divide-gray-100 md:hidden">

          {filteredStudents.length === 0 ? (

            <div className="px-6 py-12 text-center">

              <p className="text-sm font-medium text-gray-700">
                No students found
              </p>

            </div>

          ) : (

            filteredStudents.map((student) => (

              <div
                key={student.id}
                className="p-5"
              >

                <div className="flex items-center gap-3">

                  <StudentPhoto
                    student={student}
                  />

                  <div className="min-w-0">

                    <p className="truncate font-semibold text-gray-900">
                      {student.name}
                    </p>

                    <p className="mt-0.5 text-sm text-gray-500">
                      {student.registerNumber}
                    </p>

                  </div>

                </div>


                <div className="mt-4 grid grid-cols-2 gap-4">

                  <div>

                    <p className="text-xs text-gray-400">
                      Department
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-700">
                      {student.department?.code ||
                        student.department?.name ||
                        "—"}
                    </p>

                  </div>


                  <div>

                    <p className="text-xs text-gray-400">
                      Semester
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-700">
                      {student.semester || "—"}
                    </p>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   STUDENT PHOTO
===================================================== */

function StudentPhoto({ student }) {

  if (student.photoUrl) {

    return (
      <img
        src={student.photoUrl}
        alt={student.name}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
      />
    );

  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg">
      👤
    </div>
  );
}