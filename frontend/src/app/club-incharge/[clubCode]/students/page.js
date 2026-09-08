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
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const [deletingId, setDeletingId] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

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

      setStudents(response.data.students || []);
      setClub(response.data.club || null);
    } catch (error) {
      console.error(
        "Club students error:",
        error.response?.data || error.message
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
  // DELETE STUDENT
  // ==================================================

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      setDeletingId(studentToDelete.id);
      setError("");
      setSuccess("");

      const token = await getToken();

      const response = await api.delete(
        `/api/club-incharge/${clubCode}/students/${studentToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        setStudents((current) =>
          current.filter(
            (student) =>
              student.id !== studentToDelete.id
          )
        );

        setSuccess(
          response.data.message ||
            "Student deleted successfully"
        );

        setStudentToDelete(null);

        // Remove success message after 4 seconds
        setTimeout(() => {
          setSuccess("");
        }, 4000);
      }
    } catch (error) {
      console.error(
        "Delete student error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete student"
      );

      setStudentToDelete(null);
    } finally {
      setDeletingId(null);
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
        return (a.name || "").localeCompare(
          b.name || ""
        );
      }

      if (sortBy === "registerNumber") {
        return (a.registerNumber || "").localeCompare(
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
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
          Loading students...
        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error && students.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <svg
            className="h-6 w-6 text-red-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 003.84 21h16.32a2 2 0 001.73-3.14l-8.18-14a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Unable to load students
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>

        <button
          onClick={loadStudents}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
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
    <>
      <div className="mx-auto max-w-7xl">
        {/* ==============================================
            HEADER
        ============================================== */}

        <div className="mb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-blue-600" />

                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Club Members
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Students
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {club?.name ||
                  `${clubCode?.toUpperCase()} Club`}{" "}
                members
              </p>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100">
              <p className="text-xs font-medium text-gray-400">
                Total Students
              </p>

              <p className="mt-0.5 text-xl font-bold text-gray-900">
                {students.length}
              </p>
            </div>
          </div>
        </div>

        {/* ==============================================
            SUCCESS MESSAGE
        ============================================== */}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <svg
                className="h-4 w-4 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12l4 4L19 6"
                />
              </svg>
            </div>

            <p className="text-sm font-medium text-emerald-700">
              {success}
            </p>
          </div>
        )}

        {/* ==============================================
            ERROR MESSAGE
        ============================================== */}

        {error && students.length > 0 && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-4 w-4 text-red-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>

            <button
              onClick={() => setError("")}
              className="text-xs font-medium text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ==============================================
            SEARCH + SORT
        ============================================== */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          {/* SEARCH */}

          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />
              <path
                strokeLinecap="round"
                d="m20 20-4-4"
              />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by name, register number or department"
              className="w-full rounded-xl bg-white py-3 pl-10 pr-4 text-sm text-gray-800 outline-none ring-1 ring-gray-200 transition placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
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

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80">
          {/* DESKTOP */}

          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left">
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

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-14 text-center"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <circle
                            cx="11"
                            cy="11"
                            r="7"
                          />
                          <path
                            strokeLinecap="round"
                            d="m20 20-4-4"
                          />
                        </svg>
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
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="transition hover:bg-gray-50/70"
                    >
                      {/* STUDENT */}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <StudentPhoto
                            student={student}
                          />

                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">
                              {student.name}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* REGISTER NUMBER */}

                      <td className="px-6 py-4">
                        <span className="rounded-md bg-gray-50 px-2.5 py-1 text-sm font-medium text-gray-700">
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

                      {/* DELETE */}

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setStudentToDelete(
                              student
                            )
                          }
                          disabled={
                            deletingId === student.id
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <TrashIcon />
                          Delete
                        </button>
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
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                    />
                    <path
                      strokeLinecap="round"
                      d="m20 20-4-4"
                    />
                  </svg>
                </div>

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No students found
                </p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <StudentPhoto
                        student={student}
                      />

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {student.name}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {student.email}
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-700">
                          {student.registerNumber}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setStudentToDelete(student)
                      }
                      disabled={
                        deletingId === student.id
                      }
                      aria-label={`Delete ${student.name}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                        Department
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-700">
                        {student.department?.code ||
                          student.department?.name ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                        Semester
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-700">
                        {student.semester || "—"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setStudentToDelete(student)
                    }
                    disabled={
                      deletingId === student.id
                    }
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <TrashIcon />
                    Delete Student
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          DELETE CONFIRMATION MODAL
      ================================================== */}

      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 px-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* Modal Header */}

            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50">
                  <TrashIcon large />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Delete Student?
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-gray-500">
                    This action permanently removes the
                    student account and all related data.
                  </p>
                </div>
              </div>
            </div>

            {/* Student */}

            <div className="px-6 py-5">
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <StudentPhoto
                  student={studentToDelete}
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {studentToDelete.name}
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {studentToDelete.registerNumber}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-semibold text-red-700">
                  The following will be deleted:
                </p>

                <p className="mt-2 text-xs leading-5 text-red-600">
                  Student profile, club memberships,
                  attendance records, certificates,
                  MongoDB account, Clerk account and
                  profile photo.
                </p>
              </div>
            </div>

            {/* Buttons */}

            <div className="flex gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  setStudentToDelete(null)
                }
                disabled={deletingId !== null}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={deletingId !== null}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId !== null ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon />
                    Delete Student
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


// =====================================================
// TRASH ICON
// =====================================================

function TrashIcon({ large = false }) {
  return (
    <svg
      className={
        large
          ? "h-5 w-5"
          : "h-4 w-4"
      }
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
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
        alt={student.name}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
      {student.name
        ?.charAt(0)
        ?.toUpperCase() || "S"}
    </div>
  );
}