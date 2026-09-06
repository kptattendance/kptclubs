"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function HODStudentsPage() {

  const {
    getToken,
    isLoaded,
  } = useAuth();


  const [students, setStudents] =
    useState([]);

  const [department, setDepartment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [sortBy, setSortBy] =
    useState("name");


  // =====================================================
  // LOAD STUDENTS
  // =====================================================

 const loadStudents = async () => {

  try {

    setLoading(true);
    setError("");

    const token = await getToken();

    console.log(
      "HOD Clerk token:",
      token
    );

    const response = await api.get(
      "/api/hod/department/students",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setStudents(
      response.data.students || []
    );

    setDepartment(
      response.data.department || null
    );

  } catch (error) {

    console.error(
      "Failed to load HOD students:",
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

  // =====================================================
  // LOAD ONCE AUTHENTICATION IS READY
  // =====================================================

  useEffect(() => {

    if (!isLoaded) return;

    loadStudents();

  }, [isLoaded]);


  // =====================================================
  // SEARCH + SORT
  // =====================================================

  const filteredStudents =
    useMemo(() => {

      let result =
        [...students];


      // SEARCH
      if (search.trim()) {

        const value =
          search
            .trim()
            .toLowerCase();

        result =
          result.filter(
            (student) =>

              student.name
                ?.toLowerCase()
                .includes(value) ||

              student.registerNumber
                ?.toLowerCase()
                .includes(value) ||

              student.email
                ?.toLowerCase()
                .includes(value) ||

              student.club?.name
                ?.toLowerCase()
                .includes(value)
          );

      }


      // SORT
      result.sort((a, b) => {

        if (sortBy === "name") {

          return (
            (a.name || "")
              .localeCompare(
                b.name || ""
              )
          );

        }


        if (sortBy === "registerNumber") {

          return (
            (a.registerNumber || "")
              .localeCompare(
                b.registerNumber || ""
              )
          );

        }


        if (sortBy === "club") {

          return (
            (a.club?.name || "No Club")
              .localeCompare(
                b.club?.name || "No Club"
              )
          );

        }


        if (sortBy === "status") {

          return (
            Number(b.isActive) -
            Number(a.isActive)
          );

        }


        return 0;

      });


      return result;

    }, [
      students,
      search,
      sortBy,
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

    <div className="space-y-6">


      {/* =================================================
          HEADER
      ================================================= */}

      <div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Department Students
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Students belonging to your department.
            </p>

          </div>


          {department && (

            <div className="rounded-lg bg-blue-50 px-4 py-2">

              <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
                Department
              </p>

              <p className="text-sm font-semibold text-blue-700">
                {department.code} — {department.name}
              </p>

            </div>

          )}

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="rounded-xl border border-red-200 bg-red-50 p-4">

          <p className="text-sm text-red-600">
            {error}
          </p>

          <button
            onClick={loadStudents}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try Again
          </button>

        </div>

      )}


      {!error && (

        <>


          {/* =================================================
              TOOLBAR
          ================================================= */}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            {/* SEARCH */}

            <div className="relative w-full sm:max-w-sm">

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search students..."
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* SORT */}

            <div className="flex items-center gap-2">

              <label className="text-sm text-gray-500">
                Sort:
              </label>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >

                <option value="name">
                  Name
                </option>

                <option value="registerNumber">
                  Register Number
                </option>

                <option value="club">
                  Club
                </option>

                <option value="status">
                  Status
                </option>

              </select>

            </div>

          </div>


          {/* =================================================
              TABLE
          ================================================= */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-100 px-5 py-4">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="font-semibold text-gray-900">
                    Students
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {filteredStudents.length} student
                    {filteredStudents.length !== 1
                      ? "s"
                      : ""}
                  </p>

                </div>

              </div>

            </div>


            {/* MOBILE SCROLL */}

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50">

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Student
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Register No.
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Department
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Club
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Club Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredStudents.length === 0 ? (

                    <tr>

                      <td
                        colSpan="6"
                        className="px-5 py-12 text-center"
                      >

                        <div className="text-3xl">
                          👥
                        </div>

                        <p className="mt-3 text-sm font-medium text-gray-700">
                          No students found
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Try changing your search.
                        </p>

                      </td>

                    </tr>

                  ) : (

                    filteredStudents.map(
                      (student) => (

                        <tr
                          key={student._id}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                        >

                          {/* STUDENT */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              {student.profilePhoto ? (

                                <img
                                  src={
                                    student.profilePhoto
                                  }
                                  alt={
                                    student.name
                                  }
                                  className="h-11 w-11 rounded-full object-cover"
                                />

                              ) : (

                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-lg">
                                  👤
                                </div>

                              )}


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

                          <td className="px-5 py-4">

                            <span className="font-medium text-gray-700">
                              {student.registerNumber ||
                                "-"}
                            </span>

                          </td>


                          {/* DEPARTMENT */}

                          <td className="px-5 py-4">

                            <div>

                              <p className="font-medium text-gray-800">
                                {
                                  student.department
                                    ?.code
                                }
                              </p>

                              <p className="text-xs text-gray-500">
                                {
                                  student.department
                                    ?.name
                                }
                              </p>

                            </div>

                          </td>


                          {/* CLUB */}

                          <td className="px-5 py-4">

                            {student.club ? (

                              <div>

                                <p className="font-medium text-gray-800">
                                  {
                                    student.club
                                      .name
                                  }
                                </p>

                                <p className="text-xs text-gray-500">
                                  {
                                    student.club
                                      .code
                                  }
                                </p>

                              </div>

                            ) : (

                              <span className="text-sm text-gray-400">
                                No Club
                              </span>

                            )}

                          </td>


                          {/* CLUB STATUS */}

                          <td className="px-5 py-4">

                            <ClubStatus
                              status={
                                student.clubStatus
                              }
                            />

                          </td>


                          {/* USER STATUS */}

                          <td className="px-5 py-4">

                            {student.isActive ? (

                              <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                Active
                              </span>

                            ) : (

                              <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                Inactive
                              </span>

                            )}

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </>

      )}

    </div>

  );

}


/*
=====================================================
CLUB STATUS
=====================================================
*/

function ClubStatus({ status }) {

  if (!status) {

    return (

      <span className="text-sm text-gray-400">
        -
      </span>

    );

  }


  const statusMap = {

    PENDING_CLUB_APPROVAL: {
      label: "Club Pending",
      classes:
        "bg-yellow-50 text-yellow-700",
    },

    PENDING_HOD_APPROVAL: {
      label: "HOD Pending",
      classes:
        "bg-orange-50 text-orange-700",
    },

    CONFIRMED: {
      label: "Confirmed",
      classes:
        "bg-green-50 text-green-700",
    },

    REJECTED_BY_CLUB: {
      label: "Club Rejected",
      classes:
        "bg-red-50 text-red-700",
    },

    REJECTED_BY_HOD: {
      label: "HOD Rejected",
      classes:
        "bg-red-50 text-red-700",
    },

  };


  const item =
    statusMap[status] || {
      label: status,
      classes:
        "bg-gray-50 text-gray-600",
    };


  return (

    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${item.classes}`}
    >
      {item.label}
    </span>

  );

}